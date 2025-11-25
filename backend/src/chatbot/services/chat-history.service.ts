import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatHistory } from '../entities/chat-history.entity';

@Injectable()
export class ChatHistoryService {
  constructor(
    @InjectRepository(ChatHistory)
    private chatHistoryRepository: Repository<ChatHistory>,
  ) {}

  async saveMessage(userId: string, message: string, role: 'user' | 'assistant' | 'system', sessionId?: string, timestamp?: Date): Promise<ChatHistory> {
    const chatHistory = this.chatHistoryRepository.create({
      userId,
      message,
      role,
      sessionId,
      timestamp: timestamp || new Date(),
    });
    return this.chatHistoryRepository.save(chatHistory);
  }

  async getChatHistory(userId: string, limit: number = 50): Promise<ChatHistory[]> {
    return this.chatHistoryRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getChatHistoryBySession(userId: string, sessionId: string): Promise<ChatHistory[]> {
    // Handle default session for messages without sessionId
    const whereCondition = sessionId === 'default-session'
      ? { userId, sessionId: null }
      : { userId, sessionId };

    return this.chatHistoryRepository.find({
      where: whereCondition,
      order: { createdAt: 'ASC' },
    });
  }

  async getChatSessions(userId: string): Promise<any[]> {
    const messages = await this.chatHistoryRepository.find({
      where: { userId },
      select: ['sessionId', 'timestamp', 'createdAt'],
      order: { createdAt: 'DESC' },
    });

    // Group by sessionId and get stats
    const sessionMap = new Map<string, { sessionId: string; createdAt: Date; messageCount: number; lastMessage: Date }>();
    messages.forEach(msg => {
      // Use sessionId if available, otherwise use 'default' for messages without session
      const sessionKey = msg.sessionId || 'default-session';
      // Use timestamp if available, otherwise fall back to createdAt
      const messageTime = msg.timestamp || msg.createdAt;
      if (!sessionMap.has(sessionKey)) {
        sessionMap.set(sessionKey, {
          sessionId: sessionKey,
          createdAt: msg.createdAt,
          messageCount: 0,
          lastMessage: messageTime
        });
      }
      const session = sessionMap.get(sessionKey);
      session.messageCount++;
      if (messageTime > session.lastMessage) {
        session.lastMessage = messageTime;
      }
    });

    return Array.from(sessionMap.values()).sort((a, b) => b.lastMessage.getTime() - a.lastMessage.getTime());
  }

  async deleteChatHistory(userId: string): Promise<void> {
    await this.chatHistoryRepository.delete({ userId });
  }

  async deleteChatSession(userId: string, sessionId: string): Promise<void> {
    await this.chatHistoryRepository.delete({ userId, sessionId });
  }
}