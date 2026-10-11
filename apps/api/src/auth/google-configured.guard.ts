import { CanActivate, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleConfiguredGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(): boolean {
    if (!this.config.get<string>('GOOGLE_CLIENT_ID') || !this.config.get<string>('GOOGLE_CLIENT_SECRET')) {
      throw new ServiceUnavailableException('Google sign-in is not configured');
    }

    return true;
  }
}
