import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import configuration from './config/configuration';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { GeminiModule } from './gemini/gemini.module';
import entities from './model';
import { MulterModule } from '@nestjs/platform-express';
import { DoctorModule } from './doctor/doctor.module';
import { AppointmentModule } from './appointment/appointment.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration]
    }),

    MulterModule.register({
      dest: "upload"
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: +configService.get<number>('database.port')!,
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.name'),
        entities: entities,
        synchronize: true, // Don't use this option for prod mode
        keepConnectionAlive: true,
        timezone: 'UTC',
        ssl: configService.get('database.ssl'),
        extra: configService.get('database.ssl') ? {
          ssl: {
            rejectUnauthorized: false
          }
        } : null,
        autoLoadEntities: true
      }),
      inject: [ConfigService]
    }),
    UsersModule,
    GeminiModule,
    DoctorModule,
    AppointmentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
