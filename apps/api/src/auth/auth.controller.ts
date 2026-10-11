import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { REFRESH_COOKIE_NAME } from './auth.constants.js';
import { AuthService } from './auth.service.js';
import type { AuthenticatedRequest } from './auth.types.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { ExchangeOAuthTicketDto } from './dto/exchange-oauth-ticket.dto.js';
import { GoogleConfiguredGuard } from './google-configured.guard.js';
import type { GoogleIdentity } from './google.strategy.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(dto);
    this.setRefreshCookie(response, result.refreshToken);
    return result.payload;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(dto);
    this.setRefreshCookie(response, result.refreshToken);
    return result.payload;
  }

  @Post('password/reset-request')
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 3, ttl: 15 * 60_000 } })
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    await this.authService.requestPasswordReset(dto.email, dto.locale ?? 'ru');
    return { message: 'If an account exists for this email, a reset link will be sent.' };
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 5, ttl: 15 * 60_000 } })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Get('google')
  @UseGuards(GoogleConfiguredGuard, AuthGuard('google'))
  googleLogin(): void {
    return;
  }

  @Get('google/callback')
  @UseGuards(GoogleConfiguredGuard, AuthGuard('google'))
  async googleCallback(
    @Req() request: Request & { user: GoogleIdentity },
    @Res() response: Response,
  ): Promise<void> {
    const ticket = await this.authService.loginWithGoogle(request.user);
    const locale = request.cookies?.nutrilog_google_locale;
    const safeLocale = locale === 'uk' || locale === 'en' ? locale : 'ru';
    const callbackUrl = new URL(`/${safeLocale}/auth/callback`, process.env.WEB_ORIGIN ?? 'http://localhost:3000');
    callbackUrl.hash = `ticket=${ticket}`;
    response.redirect(callbackUrl.toString());
  }

  @Post('oauth/exchange')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async exchangeOAuthTicket(
    @Body() dto: ExchangeOAuthTicketDto,
    @Headers('origin') origin: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.exchangeOAuthTicket(dto.ticket, origin);
    this.setRefreshCookie(response, result.refreshToken);
    return result.payload;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async refresh(
    @Req() request: Request,
    @Headers('origin') origin: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.refresh(
      request.cookies?.[REFRESH_COOKIE_NAME],
      origin,
    );
    this.setRefreshCookie(response, result.refreshToken);
    return result.payload;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: Request,
    @Headers('origin') origin: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logout(request.cookies?.[REFRESH_COOKIE_NAME], origin);
    response.clearCookie(REFRESH_COOKIE_NAME, this.authService.refreshCookieOptions);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  getCurrentUser(@Req() request: AuthenticatedRequest) {
    return request.user;
  }

  private setRefreshCookie(response: Response, refreshToken: string): void {
    response.cookie(REFRESH_COOKIE_NAME, refreshToken, this.authService.refreshCookieOptions);
  }
}
