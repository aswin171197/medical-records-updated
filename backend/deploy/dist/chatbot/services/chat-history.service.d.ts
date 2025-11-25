import { Repository } from 'typeorm';
import { ChatHistory } from '../entities/chat-history.entity';
export declare class ChatHistoryService {
    private chatHistoryRepository;
    constructor(chatHistoryRepository: Repository<ChatHistory>);
    saveMessage(userId: string, message: string, role: 'user' | 'assistant' | 'system', sessionId?: string, timestamp?: Date): Promise<ChatHistory>;
    getChatHistory(userId: string, limit?: number): Promise<ChatHistory[]>;
    getChatHistoryBySession(userId: string, sessionId: string): Promise<ChatHistory[]>;
    getChatSessions(userId: string): Promise<any[]>;
    deleteChatHistory(userId: string): Promise<void>;
    deleteChatSession(userId: string, sessionId: string): Promise<void>;
}
