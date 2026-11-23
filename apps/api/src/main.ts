import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { getAllowedWebOrigins } from './config/web-origins.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(helmet({ contentSecurityPolicy: isProduction ? undefined : false }));
  app.use(cookieParser());
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: getAllowedWebOrigins(process.env.WEB_ORIGIN, isProduction),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: isProduction,
    }),
  );
  app.enableShutdownHooks();

  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('NutriLog API')
      .setDescription('REST API for NutriLog nutrition tracking. Register or log in to receive a bearer access token for protected endpoints.')
      .setVersion('1.0')
      .addTag('auth', 'Registration, login, sessions, and password reset')
      .addTag('profile', 'User profile and nutrition targets')
      .addTag('foods', 'Food catalog and search')
      .addTag('diary', 'Daily food diary and meal entries')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig));
  }

  const port = Number(process.env.API_PORT ?? 4000);
  const host = process.env.HOST ?? (isProduction ? '0.0.0.0' : '127.0.0.1');
  await app.listen(port, host);
}

void bootstrap();
