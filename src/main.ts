import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //swagger config
  const config = new DocumentBuilder()
    .setTitle('Startup API')
    .setDescription('API documentaion for Startup API')
    .setVersion('1.0.0')
    .setContact(
      'Dimitri',
      'https://dimitrikokhtashvili.dev',
      'dl.kokhtashvili@gmail.com',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
