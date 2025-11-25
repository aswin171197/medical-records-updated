import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { V3AiService } from '../services/v3-ai.service';
export declare class AptGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly v3AiService;
    server: Server;
    private readonly logger;
    private connections;
    constructor(v3AiService: V3AiService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    startAptSession(client: Socket): Promise<void>;
    handleTextMessage(client: Socket, text: string): void;
    handleAudioChunk(client: Socket, audioData: {
        data: string;
        mimeType: string;
    }): void;
    private handleGeminiMessage;
    handleEndSession(client: Socket): void;
}
