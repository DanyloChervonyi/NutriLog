import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AUTH_AUDIENCE, AUTH_ISSUER } from './auth.constants.js';
import { AuthService } from './auth.service.js';
import type { AuthenticatedUser } from './auth.types.js';

type AccessClaims = Readonly<{ sub: string; sid: string; tokenUse: 'access' }>;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService, private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      issuer: AUTH_ISSUER,
      audience: AUTH_AUDIENCE,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: AccessClaims): Promise<AuthenticatedUser> {
    if (
      !payload ||
      typeof payload.sub !== 'string' ||
      typeof payload.sid !== 'string' ||
      payload.tokenUse !== 'access'
    ) {
      throw new UnauthorizedException();
    }

    return this.authService.getCurrentUser(payload.sub, payload.sid);
  }
}
