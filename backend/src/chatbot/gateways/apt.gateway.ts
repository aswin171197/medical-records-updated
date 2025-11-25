import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { V3AiService } from '../services/v3-ai.service';

// Define interfaces for missing types
interface LiveServerMessage {
    serverContent?: {
        modelTurn?: {
            parts?: any[];
        };
        outputTranscription?: {
            text?: string;
        };
        inputTranscription?: {
            text?: string;
        };
        turnComplete?: boolean;
        interrupted?: boolean;
    };
}

interface Session {
    sendClientContent(content: any): void;
    sendRealtimeInput(input: any): void;
    close(): void;
}

@WebSocketGateway({
    cors: {
        origin: '*', // Be more specific in production
        credentials: true,
    },
    namespace: '/apt', // Separate namespace for APT sessions
})
export class AptGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(AptGateway.name);
    private connections = new Map<string, Session>();

    constructor(private readonly v3AiService: V3AiService) { }

    handleConnection(client: Socket) {
        this.logger.log(`APT client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`APT client disconnected: ${client.id}`);
        const geminiSession = this.connections.get(client.id);
        if (geminiSession) {
            geminiSession.close();
            this.connections.delete(client.id);
            this.logger.log(`Gemini session closed and removed for APT client: ${client.id}`);
        }
    }

    @SubscribeMessage('start-session')
    async startAptSession(@ConnectedSocket() client: Socket) {
        if (this.connections.has(client.id)) {
            this.logger.warn(`APT client ${client.id} already has an active session.`);
            client.emit('session-error', { message: 'Session already active.' });
            return;
        }

        this.logger.log(`Starting Gemini session for APT client: ${client.id}`);
        try {
            const geminiSession = await this.v3AiService.createLiveSession({
                onOpen: () => {
                    this.logger.log(`Gemini session opened for APT client: ${client.id}`);
                    client.emit('session-started');
                },
                onMessage: async (message: LiveServerMessage) => {
                    if (message) {
                        this.handleGeminiMessage(client, message);
                    } else {
                        await new Promise((resolve) => setTimeout(resolve, 100));
                    }
                },
                onError: (error: ErrorEvent) => {
                    this.logger.error(`Gemini session error for APT client ${client.id}:`, error.message);
                    client.emit('session-error', { message: error.message });
                    this.connections.delete(client.id);
                },
                onClose: (event: CloseEvent) => {
                    this.logger.log(`Gemini session closed for APT client ${client.id}: ${event.reason}`);
                    client.emit('session-closed', { reason: event.reason });
                    this.connections.delete(client.id);
                },
            }, 'apt');

            this.connections.set(client.id, geminiSession);
        } catch (error) {
            this.logger.error(`Failed to start Gemini session for APT client ${client.id}:`, error);
            client.emit('session-error', {
                message: 'Failed to initiate Gemini session.',
            });
        }
    }

    @SubscribeMessage('send-text')
    handleTextMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() text: string,
    ) {
        const geminiSession = this.connections.get(client.id);
        if (geminiSession) {
            this.logger.log(`Sending text from APT client ${client.id}: "${text}"`);
            geminiSession.sendClientContent({ turns: [text] });
        } else {
            this.logger.warn(`APT client ${client.id} tried to send text without a session.`);
            client.emit('session-error', { message: 'No active session.' });
        }
    }

    @SubscribeMessage('send-audio-chunk')
    handleAudioChunk(
        @ConnectedSocket() client: Socket,
        @MessageBody() audioData: { data: string; mimeType: string },
    ) {
        const geminiSession = this.connections.get(client.id);
        if (geminiSession) {
            geminiSession.sendRealtimeInput({
                media: audioData
            })
        } else {
            this.logger.warn(`APT client ${client.id} tried to send audio without a session.`);
            client.emit('session-error', { message: 'No active session.' });
        }
    }

    // Handle Gemini messages for APT interactions
    private handleGeminiMessage(client: Socket, message: LiveServerMessage) {
        if(message.serverContent){
            const part = message.serverContent?.modelTurn?.parts?.[0];
            if (part?.inlineData) {
                client.emit('audio-part', {
                    audio: {
                        data: part.inlineData.data, // This is a base64 string
                        mimeType: part.inlineData.mimeType,
                    },
                });
            }

            const outputTranscription = message.serverContent?.outputTranscription?.text;
            if (outputTranscription) {
                client.emit('text-part', { text: outputTranscription, user: 'apt' });
            }

            const inputTranscription = message.serverContent?.inputTranscription;
            if (inputTranscription) {
                this.logger.log('Gemini session message received:', JSON.stringify(message));
                if(inputTranscription?.text){
                    client.emit('text-part', { text: inputTranscription?.text, user: 'user' });
                }

            }

            const turnCompleted = message.serverContent?.turnComplete;
            if (turnCompleted) {
                client.emit('turn-completed', { user: 'user' });
            }

            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
                client.emit('turn-interrupted', { user: 'user' });
            }

        }
    }

    @SubscribeMessage('end-session')
    handleEndSession(@ConnectedSocket() client: Socket) {
        this.logger.log(`APT client ${client.id} requested to end the session.`);
        this.handleDisconnect(client);
    }
}