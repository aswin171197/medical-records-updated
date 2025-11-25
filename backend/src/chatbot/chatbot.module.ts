
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotGateway } from './gateways/bot.gateway';
import { V3AiService } from './services/v3-ai.service';
import { ChatHistoryService } from './services/chat-history.service';
import { ChatHistoryController } from './controllers/chat-history.controller';
import { ChatHistory } from './entities/chat-history.entity';


@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([ChatHistory])
  ],
  controllers: [ChatHistoryController],
  providers: [
    V3AiService,
    ChatHistoryService,
    BotGateway,
  ],
})
export class ChatbotModule {}