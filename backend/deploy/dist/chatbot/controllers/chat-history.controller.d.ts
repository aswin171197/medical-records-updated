import { ChatHistoryService } from '../services/chat-history.service';
export declare class ChatHistoryController {
    private readonly chatHistoryService;
    constructor(chatHistoryService: ChatHistoryService);
    saveMessage(body: {
        message: string;
        role: 'user' | 'assistant' | 'system';
        sessionId?: string;
        timestamp?: string;
    }, req: any): Promise<import("../entities/chat-history.entity").ChatHistory>;
    getChatHistory(req: any): Promise<import("../entities/chat-history.entity").ChatHistory[]>;
    getChatSessions(req: any): Promise<any[]>;
    getChatHistoryBySession(sessionId: string, req: any): Promise<import("../entities/chat-history.entity").ChatHistory[]>;
    deleteChatHistory(req: any): Promise<{
        message: string;
    }>;
    deleteChatSession(sessionId: string, req: any): Promise<{
        message: string;
    }>;
}
