// backend/src/chatbot/gateways/bot.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { LiveServerMessage, Session } from '@google/genai';
import { V3AiService } from '../services/v3-ai.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class BotGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(BotGateway.name);

  // Maps
  private connections = new Map<string, Session>();
  private emitCache = new Map<string, Set<string>>();
  private medicalDataStore = new Map<string, string>();

  constructor(private readonly geminiLiveService: V3AiService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    const session = this.connections.get(client.id);
    if (session) {
      try {
        session.close();
      } catch {}
    }

    this.connections.delete(client.id);
    this.emitCache.delete(client.id);
    this.medicalDataStore.delete(client.id);
  }

  @SubscribeMessage('start-session')
  async startSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() opts: any = {},
  ) {
    this.logger.log(
      `Client ${client.id} requested start-session. Provided keys: ${Object.keys(opts).join(', ')}`
    );

    try {
      /** VALIDATE medicalData INPUT */
      if (opts.medicalData && typeof opts.medicalData !== 'string') {
        client.emit('session-error', { message: 'medicalData must be a string' });
        return;
      }

      if (this.connections.has(client.id)) {
        client.emit('session-error', { message: 'Session already active' });
        return;
      }

      /** STORE MEDICAL DATA SECURELY IN BACKEND ONLY */
      if (opts.medicalData) {
        const MAX_LEN = Number(process.env.MAX_MEDICAL_DATA_CHARS || 20000);
        let stored = opts.medicalData;

        if (stored.length > MAX_LEN) {
          stored = stored.slice(0, MAX_LEN) + '...[TRUNCATED]';
        }

        this.medicalDataStore.set(client.id, stored);

        this.logger.log(
          `Stored medicalData for client ${client.id}. Length = ${stored.length}`
        );
      }

      /** CREATE GEMINI SESSION (WITH INTERNAL MEDICAL CONTEXT) */
      const geminiSession = await this.geminiLiveService.createLiveSession(
        {
          onOpen: () => {
            this.emitCache.set(client.id, new Set());
            client.emit('session-started');
          },

          onMessage: (message) => {
            this.handleGeminiMessage(client, message);
          },

          onError: (err) => {
            client.emit('session-error', { message: err.message || 'Gemini error' });
            this.connections.delete(client.id);
            this.emitCache.delete(client.id);
            this.medicalDataStore.delete(client.id);
          },

          onClose: (evt) => {
            client.emit('session-closed', { reason: evt?.reason || 'closed' });
            this.connections.delete(client.id);
            this.emitCache.delete(client.id);
            this.medicalDataStore.delete(client.id);
          },
        },
        'bot',
        {
          medicalData: this.medicalDataStore.get(client.id),
        },
      );

      this.connections.set(client.id, geminiSession);
    } catch (error) {
      this.logger.error('Failed to start session:', error);
      client.emit('session-error', {
        message: 'Failed to start session: ' + (error.message || 'unknown'),
      });
    }
  }

  @SubscribeMessage('send-text')
  handleTextMessage(@ConnectedSocket() client: Socket, @MessageBody() text: string) {
    const session = this.connections.get(client.id);
    if (!session) {
      client.emit('session-error', { message: 'No active session' });
      return;
    }

    try {
      session.sendClientContent({ turns: [text] });
    } catch (e) {
      client.emit('session-error', { message: 'Failed to send text' });
    }
  }

  @SubscribeMessage('send-audio-chunk')
  handleAudioChunk(
    @ConnectedSocket() client: Socket,
    @MessageBody() audio: { data: string; mimeType: string; final?: boolean },
  ) {
    const session = this.connections.get(client.id);

    if (!session) {
      client.emit('session-error', { message: 'No active session' });
      return;
    }

    const payload = {
      data: audio.data,
      mimeType: audio.mimeType,
      final: audio.final ?? false,
    };

    try {
      session.sendRealtimeInput({ media: payload });
    } catch (e) {
      client.emit('session-error', { message: 'Failed to send audio' });
    }
  }

  private handleGeminiMessage(client: Socket, message: LiveServerMessage) {
    if (!message?.serverContent) return;

    const serverContent = message.serverContent;

    const part = serverContent?.modelTurn?.parts?.[0];
    const outputText = serverContent?.outputTranscription?.text;
    const userInputText = serverContent?.inputTranscription?.text;

    /** Stream Audio */
    if (part?.inlineData?.data) {
      client.emit('audio-part', {
        id: Date.now(),
        audio: {
          data: part.inlineData.data,
          mimeType: part.inlineData.mimeType || 'audio/mpeg',
        },
      });
    }

    /** Stream Bot Text */
    if (outputText) {
      client.emit('text-part', {
        id: Date.now(),
        text: outputText,
        user: 'bot',
        timestamp: Date.now(),
      });
    }

    /** Stream User Voice Transcription */
    if (userInputText) {
      client.emit('text-part', {
        id: Date.now(),
        text: userInputText,
        user: 'user',
        timestamp: Date.now(),
      });
    }

    /** Turn Events */
    if (serverContent.turnComplete) {
      client.emit('turn-completed', {});
    }
  }

  @SubscribeMessage('end-session')
  handleEndSession(@ConnectedSocket() client: Socket) {
    this.handleDisconnect(client);
  }
}
