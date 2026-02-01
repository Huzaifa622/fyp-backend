import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Skin Disease Detection')
    .setVersion('0.0.1')
    .setDescription("Skin Disease system")
    .addTag("auth services")
    .addBearerAuth()
    .build();

  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, doc)

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? true,
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type', 'Accept'],
    exposedHeaders: ['Set-Cookie', 'Authorization']
  })

  app.use((req, res, next) => {
    console.log(new Date().toISOString(), req.method, req.url);
    next();
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000; 
await app.listen(port, '0.0.0.0');

}
bootstrap();
