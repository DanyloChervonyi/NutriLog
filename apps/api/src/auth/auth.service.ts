import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import * as argon2 from 'argon2';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  ACCESS_TOKEN_TTL_DEFAULT,
  AUTH_AUDIENCE,
  AUTH_ISSUER,
  REFRESH_COOKIE_PATH,
  REFRESH_TOKEN_TTL_DEFAULT,
} from './auth.constants.js';
import type { AuthPayload, AuthenticatedUser, TokenPair } from './auth.types.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterDto } from './dto/register.dto.js';

const argonOptions = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

type RefreshClaims = Readonly<{ sub: string; sid: string; tokenUse: 'refresh' }>;

@Injectable()
export class AuthService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly webOrigin: string;
  readonly accessTokenTtlSeconds: number;
  readonly refreshTokenTtlSeconds: number;
  readonly refreshCookieOptions: Readonly<{
    httpOnly: true;
    secure: boolean;
    sameSite: 'strict';
    path: string;
    maxAge: number;
  }>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.accessSecret = this.getSecret(config, 'JWT_ACCESS_SECRET');
    this.refreshSecret = this.getSecret(config, 'JWT_REFRESH_SECRET');

    if (this.accessSecret === this.refreshSecret) {
      throw new Error('JWT access and refresh secrets must be different');
    }

    this.accessTokenTtlSeconds = this.getPositiveInteger(
      config,
      'JWT_ACCESS_TTL_SECONDS',
      ACCESS_TOKEN_TTL_DEFAULT,
    );
    this.refreshTokenTtlSeconds = this.getPositiveInteger(
      config,
      'JWT_REFRESH_TTL_SECONDS',
      REFRESH_TOKEN_TTL_DEFAULT,
    );
    this.webOrigin = new URL(config.get<string>('WEB_ORIGIN') ?? 'http://localhost:3000').origin;
    this.refreshCookieOptions = {
      httpOnly: true,
      secure: config.get<string>('NODE_ENV') === 'production',
      sameSite: 'strict',
      path: REFRESH_COOKIE_PATH,
      maxAge: this.refreshTokenTtlSeconds * 1000,
    };
  }

  async register(dto: RegisterDto): Promise<{ payload: AuthPayload; refreshToken: string }> {
    const email = this.normalizeEmail(dto.email);
    const passwordHash = await argon2.hash(dto.password, argonOptions);
    const sessionId = randomUUID();

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const user = await transaction.user.create({
          data: {
            email,
            passwordHash,
            firstName: dto.firstName?.trim() || null,
            lastName: dto.lastName?.trim() || null,
          },
        });
        const tokens = await this.createTokenPair(user.id, sessionId);

        await transaction.authSession.create({
          data: {
            id: sessionId,
            userId: user.id,
            refreshTokenHash: this.hashToken(tokens.refreshToken),
            expiresAt: this.refreshExpiry(),
          },
        });

        return {
          payload: this.toPayload(user, tokens.accessToken),
          refreshToken: tokens.refreshToken,
        };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('An account with this email already exists');
      }

      throw error;
    }
  }

  async login(dto: LoginDto): Promise<{ payload: AuthPayload; refreshToken: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: this.normalizeEmail(dto.email) },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        passwordHash: true,
      },
    });

    if (!user?.passwordHash) {
      await argon2.hash(dto.password, argonOptions);
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const sessionId = randomUUID();
    const tokens = await this.createTokenPair(user.id, sessionId);

    await this.prisma.authSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshTokenHash: this.hashToken(tokens.refreshToken),
        expiresAt: this.refreshExpiry(),
      },
    });

    return {
      payload: this.toPayload(user, tokens.accessToken),
      refreshToken: tokens.refreshToken,
    };
  }

  async refresh(refreshToken: string | undefined, origin: string | undefined): Promise<{
    payload: AuthPayload;
    refreshToken: string;
  }> {
    this.assertTrustedOrigin(origin);

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh session is missing');
    }

    const claims = await this.verifyRefreshToken(refreshToken);
    const session = await this.prisma.authSession.findUnique({
      where: { id: claims.sid },
      include: { user: true },
    });
    const now = new Date();

    if (
      !session ||
      session.userId !== claims.sub ||
      session.revokedAt ||
      session.expiresAt <= now
    ) {
      throw new UnauthorizedException('Refresh session is invalid or expired');
    }

    const currentHash = this.hashToken(refreshToken);
    if (!this.equalHashes(session.refreshTokenHash, currentHash)) {
      await this.prisma.authSession.updateMany({
        where: { id: session.id, userId: session.userId, revokedAt: null },
        data: { revokedAt: now },
      });
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    const tokens = await this.createTokenPair(session.userId, session.id);
    const nextHash = this.hashToken(tokens.refreshToken);
    const nextExpiry = this.refreshExpiry();
    const rotation = await this.prisma.authSession.updateMany({
      where: {
        id: session.id,
        userId: session.userId,
        refreshTokenHash: currentHash,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: { refreshTokenHash: nextHash, expiresAt: nextExpiry },
    });

    if (rotation.count !== 1) {
      throw new UnauthorizedException('Refresh session has already been rotated');
    }

    return {
      payload: this.toPayload(session.user, tokens.accessToken),
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(refreshToken: string | undefined, origin: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }

    this.assertTrustedOrigin(origin);
    const claims = await this.verifyRefreshTokenOrNull(refreshToken);

    if (claims) {
      await this.prisma.authSession.updateMany({
        where: { id: claims.sid, userId: claims.sub, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }

  async getCurrentUser(userId: string, sessionId: string): Promise<AuthenticatedUser> {
    const session = await this.prisma.authSession.findUnique({
      where: { id: sessionId },
      include: {
        user: { select: { id: true, email: true, role: true, firstName: true, lastName: true } },
      },
    });

    if (
      !session ||
      session.userId !== userId ||
      session.revokedAt ||
      session.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException();
    }

    return session.user;
  }

  private async verifyRefreshToken(token: string): Promise<RefreshClaims> {
    const claims = await this.verifyRefreshTokenOrNull(token);

    if (!claims) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    return claims;
  }

  private async verifyRefreshTokenOrNull(token: string): Promise<RefreshClaims | null> {
    try {
      const payload = await this.jwt.verifyAsync<Record<string, unknown>>(token, {
        secret: this.refreshSecret,
        issuer: AUTH_ISSUER,
        audience: AUTH_AUDIENCE,
        algorithms: ['HS256'],
      });

      if (
        typeof payload.sub !== 'string' ||
        typeof payload.sid !== 'string' ||
        payload.tokenUse !== 'refresh'
      ) {
        return null;
      }

      return { sub: payload.sub, sid: payload.sid, tokenUse: 'refresh' };
    } catch {
      return null;
    }
  }

  private async createTokenPair(userId: string, sessionId: string): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: userId, sid: sessionId, tokenUse: 'access', jti: randomUUID() },
        {
          secret: this.accessSecret,
          expiresIn: this.accessTokenTtlSeconds,
          issuer: AUTH_ISSUER,
          audience: AUTH_AUDIENCE,
          algorithm: 'HS256',
        },
      ),
      this.jwt.signAsync(
        { sub: userId, sid: sessionId, tokenUse: 'refresh', jti: randomUUID() },
        {
          secret: this.refreshSecret,
          expiresIn: this.refreshTokenTtlSeconds,
          issuer: AUTH_ISSUER,
          audience: AUTH_AUDIENCE,
          algorithm: 'HS256',
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  private toPayload(
    user: AuthenticatedUser,
    accessToken: string,
  ): AuthPayload {
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.accessTokenTtlSeconds,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private equalHashes(first: string, second: string): boolean {
    return timingSafeEqual(Buffer.from(first, 'hex'), Buffer.from(second, 'hex'));
  }

  private refreshExpiry(): Date {
    return new Date(Date.now() + this.refreshTokenTtlSeconds * 1000);
  }

  private assertTrustedOrigin(origin: string | undefined): void {
    if (origin !== this.webOrigin) {
      throw new ForbiddenException('Request origin is not allowed');
    }
  }

  private getSecret(config: ConfigService, name: string): string {
    const secret = config.getOrThrow<string>(name);

    if (Buffer.byteLength(secret, 'utf8') < 32) {
      throw new Error(`${name} must contain at least 32 bytes`);
    }

    return secret;
  }

  private getPositiveInteger(config: ConfigService, name: string, fallback: number): number {
    const configured = config.get<string>(name);
    const value = configured ? Number(configured) : fallback;

    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new Error(`${name} must be a positive integer`);
    }

    return value;
  }
}
