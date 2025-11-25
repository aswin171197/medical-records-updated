import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { V3AiService } from '../services/v3-ai.service';
export declare class BotGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly geminiLiveService;
    server: Server;
    private readonly logger;
    private connections;
    private emitCache;
    private medicalDataStore;
    constructor(geminiLiveService: V3AiService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    startSession(client: Socket, opts?: any): Promise<void>;
    startAptSession(client: Socket): Promise<void>;
    handleTextMessage(client: Socket, text: string): void;
    handleAudioChunk(client: Socket, audioData: {
        data: string;
        mimeType: string;
        final?: boolean;
    }): void;
    private handleGeminiMessage;
    handleEndSession(client: Socket): void;
}
