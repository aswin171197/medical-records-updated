import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { WhatsappService } from './whatsapp.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [WhatsappService],
  exports: [WhatsappService],
})
export class WhatsappModule {}