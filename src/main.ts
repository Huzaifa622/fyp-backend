import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
  .setTitle('auth service')
  .setVersion('0.0.1')
  .setDescription("Auth & Authorization")
  .addTag("auth services")
  .addBearerAuth()
  .build();

  const doc = SwaggerModule.createDocument(app,config);
  SwaggerModule.setup('api',app,doc)
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
