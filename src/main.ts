import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
// import IORedis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);
  app.use(cookieParser());
  // const redis = new IORedis(config.getOrThrow<string>('REDIS_URL'));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  //cors config
  app.enableCors({
    origin: config.getOrThrow<string>('ALLOWED_ORIGIN'),
    credentials: true,
    exposedHeaders: ['set-cookie'],
  });

  // swagger config
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Startup API')
    .setDescription('API documentaion for Startup API')
    .setVersion('1.0.0')
    .setContact(
      'Dimitri',
      'https://dimitrikokhtashvili.dev',
      'dl.kokhtashvili@gmail.com',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('/docs', app, document);

  await app.listen(config.getOrThrow<number>('APPLICATION_PORT'));
}
bootstrap();
