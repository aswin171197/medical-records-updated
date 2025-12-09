import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MedicalRecordModule } from './medical-record/medical-record.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { databaseConfig } from './config/database.config';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { RealtimeModule } from './realtime/realtime.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './src/.env',
    }),
    TypeOrmModule.forRoot(databaseConfig),
    MedicalRecordModule,
    AuthModule,
    UsersModule,
    WhatsappModule,
    ChatbotModule,
    RealtimeModule,

  ],
  controllers:[
   AppController
  ],
  providers: [
    AppService
  ]
})
export class AppModule {}