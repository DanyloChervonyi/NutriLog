import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private readonly client: Redis | null;

  constructor(config: ConfigService) {
    const url = config.get<string>('REDIS_URL');
    this.client = url
      ? new Redis(url, {
          lazyConnect: true,
          connectTimeout: 1_000,
          enableOfflineQueue: false,
          maxRetriesPerRequest: 1,
          retryStrategy: (attempt) => Math.min(attempt * 100, 1_000),
        })
      : null;

    this.client?.on('error', (error: Error) => {
      this.logger.warn('Redis cache unavailable: ' + error.message);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    try {
      if (!(await this.ensureConnected())) return null;
      const value = await this.client.get(key);
      if (value === null) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.warn('Redis cache read failed: ' + this.errorMessage(error));
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!this.client) return;
    try {
      if (!(await this.ensureConnected())) return;
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      this.logger.warn('Redis cache write failed: ' + this.errorMessage(error));
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.client?.disconnect();
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown Redis error';
  }

  private async ensureConnected(): Promise<boolean> {
    if (!this.client) return false;
    if (this.client.status === 'wait') await this.client.connect();
    return this.client.status === 'ready';
  }
}
