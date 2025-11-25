import { User } from '../../users/entities/user.entity';
export declare class ChatHistory {
    id: string;
    userId: string;
    user: User;
    message: string;
    role: 'user' | 'assistant' | 'system';
    timestamp: Date;
    sessionId: string;
    createdAt: Date;
    updatedAt: Date;
}
