import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.useGlobalPipes();
  const config = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('Talenter')
    .setDescription('A Service Provider Application')
    .setVersion('2.0')
    .addTag('Talenter')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('documentation', app, document);
  await app.listen(process.env.PORT || 8000);
}
bootstrap();
