import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { GeminiController } from './gemini.controller';
import { GeminiService } from './gemini.service';
import { AuthMiddleware } from 'src/middleware/auth.middleware';

@Module({
  controllers: [GeminiController],
  providers: [GeminiService]
})
export class GeminiModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(GeminiController);
  }
}{}
