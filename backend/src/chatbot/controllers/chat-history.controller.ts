import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ChatHistoryService } from '../services/chat-history.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('chat-history')
@UseGuards(JwtAuthGuard)
export class ChatHistoryController {
  constructor(private readonly chatHistoryService: ChatHistoryService) {}

  @Post()
  async saveMessage(
    @Body() body: { message: string; role: 'user' | 'assistant' | 'system'; sessionId?: string; timestamp?: string },
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const timestamp = body.timestamp ? new Date(body.timestamp) : new Date();
    return this.chatHistoryService.saveMessage(userId, body.message, body.role, body.sessionId, timestamp);
  }

  @Get()
  async getChatHistory(@Request() req: any) {
    const userId = req.user.id;
    return this.chatHistoryService.getChatHistory(userId);
  }

  @Get('sessions')
  async getChatSessions(@Request() req: any) {
    const userId = req.user.id;
    return this.chatHistoryService.getChatSessions(userId);
  }

  @Get('session/:sessionId')
  async getChatHistoryBySession(@Param('sessionId') sessionId: string, @Request() req: any) {
    const userId = req.user.id;
    return this.chatHistoryService.getChatHistoryBySession(userId, sessionId);
  }

  @Delete()
  async deleteChatHistory(@Request() req: any) {
    const userId = req.user.id;
    await this.chatHistoryService.deleteChatHistory(userId);
    return { message: 'Chat history deleted successfully' };
  }

  @Delete('session/:sessionId')
  async deleteChatSession(@Param('sessionId') sessionId: string, @Request() req: any) {
    const userId = req.user.id;
    await this.chatHistoryService.deleteChatSession(userId, sessionId);
    return { message: 'Chat session deleted successfully' };
  }

  @Get('session/:sessionId/summary')
  async getChatSessionSummary(@Param('sessionId') sessionId: string, @Request() req: any) {
    const userId = req.user.id;
    const summary = await this.chatHistoryService.summarizeSession(userId, sessionId);
    return { summary };
  }
}