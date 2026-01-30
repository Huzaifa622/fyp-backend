import { Module } from '@nestjs/common';
import { HfService } from './hf.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [HfService],
  exports: [HfService],
})
export class HfModule {}
