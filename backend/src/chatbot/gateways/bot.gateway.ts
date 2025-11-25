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
    origin: '*', // tighten in production
    credentials: true,
  },
})
export class BotGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(BotGateway.name);

  // Map of clientId -> Gemini Session
  private connections = new Map<string, Session>();

  // Map of clientId -> set of message ids we've already emitted to that client
  private emitCache = new Map<string, Set<string>>();

  // Map of clientId -> medical data string
  private medicalDataStore = new Map<string, string>();

  constructor(private readonly geminiLiveService: V3AiService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const geminiSession = this.connections.get(client.id);
    if (geminiSession) {
      try {
        geminiSession.close();
      } catch (e) {
        /* ignore */
      }
      this.connections.delete(client.id);
      this.emitCache.delete(client.id);
      this.logger.log(`Gemini session closed and removed for client: ${client.id}`);
    }
  }

  @SubscribeMessage('start-session')
  async startSession(@ConnectedSocket() client: Socket, @MessageBody() opts: any = {}) {
    this.logger.log(`Client ${client.id} requested start-session. raw opts keys: ${Object.keys(opts).join(', ')}`);

    try {
      // Validate opts.medicalData if provided
      if (opts.medicalData !== undefined) {
        if (typeof opts.medicalData !== 'string') {
          this.logger.warn(`Client ${client.id} start-session rejected: medicalData is not a string`);
          client.emit('session-error', { message: 'Invalid argument: medicalData must be a string' });
          return;
        }
        const len = opts.medicalData.length;
        this.logger.log(`Client ${client.id} medicalData length: ${len}`);
        if (len === 0) {
          // remove empty field
          delete opts.medicalData;
        // no upper bound, send all data
        }
        // Optional: additional sanitization if you want
        // opts.medicalData = opts.medicalData.replace(/[\x00-\x1F\x7F]/g, ' ');
      }

      if (this.connections.has(client.id)) {
        this.logger.warn(`Client ${client.id} already has an active session.`);
        client.emit('session-error', { message: 'Session already active.' });
        return;
      }

      this.logger.log(`Starting Gemini session for client: ${client.id}`);
      // Store medical data if provided
      const medicalData = opts?.medicalData;
      if (medicalData) {
        this.medicalDataStore.set(client.id, medicalData);
        this.logger.log(`Stored medical data for client ${client.id}, length: ${medicalData.length}`);
      }

      const geminiSession = await this.geminiLiveService.createLiveSession({
        onOpen: () => {
          this.logger.log(`Gemini session opened for client: ${client.id}`);
          this.emitCache.set(client.id, new Set<string>());
          client.emit('session-started');
        },
        onMessage: async (message: LiveServerMessage) => {
          if (message) this.handleGeminiMessage(client, message);
        },
        onError: (error: ErrorEvent | any) => {
          this.logger.error(`Gemini session error for client ${client.id}: ${error?.message || JSON.stringify(error)}`);
          client.emit('session-error', { message: error?.message || 'Gemini error' });
          this.connections.delete(client.id);
          this.emitCache.delete(client.id);
          this.medicalDataStore.delete(client.id);
        },
        onClose: (event: CloseEvent | any) => {
          this.logger.log(`Gemini session closed for client ${client.id}: ${event?.reason}`);
          client.emit('session-closed', { reason: event?.reason });
          this.connections.delete(client.id);
          this.emitCache.delete(client.id);
          this.medicalDataStore.delete(client.id);
        },
      }, 'bot', opts);

      this.connections.set(client.id, geminiSession);
    } catch (error) {
      this.logger.error(`Failed to start Gemini session for client ${client.id}: ${error?.message || error}`, error);
      client.emit('session-error', {
        message: 'Failed to initiate Gemini session: ' + (error?.message || 'unknown'),
      });
    }
  }

  @SubscribeMessage('start-apt-session')
  async startAptSession(@ConnectedSocket() client: Socket) {
    if (this.connections.has(client.id)) {
      this.logger.warn(`Client ${client.id} already has an active session.`);
      client.emit('session-error', { message: 'Session already active.' });
      return;
    }

    this.logger.log(`Starting Gemini APT session for client: ${client.id}`);
    try {
      const geminiSession = await this.geminiLiveService.createLiveSession({
        onOpen: () => {
          this.logger.log(`Gemini session opened for client: ${client.id}`);
          this.emitCache.set(client.id, new Set<string>());
          client.emit('session-started');
        },
        onMessage: async (message: LiveServerMessage) => {
          if (message) this.handleGeminiMessage(client, message);
        },
        onError: (error: ErrorEvent | any) => {
          this.logger.error(`Gemini session error for client ${client.id}: ${error?.message || JSON.stringify(error)}`);
          client.emit('session-error', { message: error?.message || 'Gemini error' });
          this.connections.delete(client.id);
          this.emitCache.delete(client.id);
        },
        onClose: (event: CloseEvent | any) => {
          this.logger.log(`Gemini session closed for client ${client.id}: ${event?.reason}`);
          client.emit('session-closed', { reason: event?.reason });
          this.connections.delete(client.id);
          this.emitCache.delete(client.id);
        },
      }, 'apt');

      this.connections.set(client.id, geminiSession);
    } catch (error) {
      this.logger.error(`Failed to start Gemini apt session for client ${client.id}:`, error);
      client.emit('session-error', {
        message: 'Failed to initiate Gemini session.',
      });
    }
  }

  @SubscribeMessage('send-text')
  handleTextMessage(@ConnectedSocket() client: Socket, @MessageBody() text: string) {
    const geminiSession = this.connections.get(client.id);
    if (geminiSession) {
      this.logger.log(`Sending text from client ${client.id}: "${text}"`);
      try {
        geminiSession.sendClientContent({ turns: [text] });
      } catch (e) {
        this.logger.error('sendClientContent error', e);
        client.emit('session-error', { message: 'Failed to send text to Gemini' });
      }
    } else {
      this.logger.warn(`Client ${client.id} tried to send text without a session.`);
      client.emit('session-error', { message: 'No active session.' });
    }
  }

  @SubscribeMessage('send-audio-chunk')
  handleAudioChunk(
    @ConnectedSocket() client: Socket,
    @MessageBody() audioData: { data: string; mimeType: string; final?: boolean },
  ) {
    const geminiSession = this.connections.get(client.id);

    try {
      const b64len = typeof audioData.data === 'string' ? audioData.data.length : 0;
      this.logger.debug(`recv audio chunk from ${client.id}: mime=${audioData.mimeType} final=${!!audioData.final} bytes(base64)=${b64len}`);
    } catch (e) {
      this.logger.debug(`recv audio chunk from ${client.id}: (could not measure size)`);
    }

    if (geminiSession) {
      const inputData: any = { data: audioData.data, mimeType: audioData.mimeType };
      if (typeof audioData.final !== 'undefined') inputData.final = !!audioData.final;
      try {
        geminiSession.sendRealtimeInput({ media: inputData });
      } catch (e) {
        this.logger.error('sendRealtimeInput error', e);
        client.emit('session-error', { message: 'Failed to forward audio to Gemini' });
      }
    } else {
      this.logger.warn(`Client ${client.id} tried to send audio without a session.`);
      client.emit('session-error', { message: 'No active session.' });
    }
  }

  private handleGeminiMessage(client: Socket, message: LiveServerMessage) {
    // Robust debug logging
    try {
      const serialized = JSON.stringify(message);
      const preview = serialized.length > 2000 ? serialized.slice(0, 2000) + '...[truncated]' : serialized;
      this.logger.debug(`Gemini message for ${client.id}: ${preview}`);
    } catch (e) {
      this.logger.debug(`Gemini message for ${client.id} received (couldn't stringify)`);
    }

    if (!message?.serverContent) {
      this.logger.warn(`No serverContent in message for ${client.id}`);
      return;
    }

    const serverContent = message.serverContent;

    // Build a stable id for dedupe. Prefer explicit ids if present.
    const stableId =
      (serverContent as any)?.id ??
      (serverContent as any)?.messageId ??
      (serverContent as any)?.turnId ??
      (serverContent?.outputTranscription?.text ? `txt:${serverContent.outputTranscription.text.slice(0,200)}` : undefined) ??
      JSON.stringify(serverContent).slice(0,200);

    const cache = this.emitCache.get(client.id) ?? new Set<string>();
    if (cache.has(String(stableId))) {
      this.logger.debug(`Skipping duplicate serverContent for ${client.id}, id=${String(stableId).slice(0,60)}`);
      return; // dedupe
    }
    // mark seen
    cache.add(String(stableId));
    this.emitCache.set(client.id, cache);

    // 1) audio part (if present)
    const part = serverContent?.modelTurn?.parts?.[0];
    if (part?.inlineData && part.inlineData.data) {
      this.logger.debug(`Emitting audio-part to ${client.id} id=${stableId}`);
      client.emit('audio-part', {
        id: stableId,
        audio: { data: part.inlineData.data, mimeType: part.inlineData.mimeType || 'audio/mpeg' },
      });
    }

    // 2) model-provided output transcription (what the bot said)
    const outputTranscription = serverContent?.outputTranscription?.text;
    if (outputTranscription) {
      this.logger.log(`Bot said (${client.id}): "${outputTranscription}"`);
      client.emit('text-part', {
        id: stableId,
        text: outputTranscription,
        user: 'bot',
        timestamp: Date.now(),
      });
    }

    // 3) text part (direct from model if text modality enabled)
    if (part?.text) {
      this.logger.log(`Bot said text (${client.id}): "${part.text}"`);
      client.emit('text-part', {
        id: stableId + '-text',
        text: part.text,
        user: 'bot',
        timestamp: Date.now(),
      });
    }

    // 3) input transcription (what the user said)
    const inputTranscription = serverContent?.inputTranscription;
    if (inputTranscription?.text) {
      this.logger.log(`User said (${client.id}): "${inputTranscription.text.substring(0,200)}"`);
      client.emit('text-part', {
        id: `${stableId}-input`,
        text: inputTranscription.text,
        user: 'user',
        timestamp: Date.now(),
      });
    }

    // 4) turn events
    if (serverContent?.turnComplete) {
      this.logger.debug(`Turn completed for ${client.id}, id=${stableId}`);
      client.emit('turn-completed', { id: stableId });
    }
    if (serverContent?.interrupted) {
      this.logger.debug(`Turn interrupted for ${client.id}, id=${stableId}`);
      client.emit('turn-interrupted', { id: stableId });
    }
  }

  @SubscribeMessage('end-session')
  handleEndSession(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client ${client.id} requested session end.`);
    this.handleDisconnect(client);
  }
}
