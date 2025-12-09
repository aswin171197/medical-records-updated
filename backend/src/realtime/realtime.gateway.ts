import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { RealtimeService } from './realtime.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(private readonly realtimeService: RealtimeService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('start-session')
  handleStartSession(client: Socket, data: any) {
    this.logger.log(`Session started for client: ${client.id}`, data);
    // Store patient context for this session
    (client as any).patientContext = {
      patientDetails: data?.patientDetails || {},
      medicalRecords: data?.medicalData ? [data.medicalData] : [],
      conversation_id: data?.conversation_id || `conv_${Date.now()}_${client.id}`
    };
    client.emit('session-started', {
      conversation_id: (client as any).patientContext.conversation_id
    });
  }

  @SubscribeMessage('send-text')
  async handleSendText(client: Socket, text: string) {
    try {
      this.logger.log(`Received text from ${client.id}:`, text?.slice(0, 200));

      const patientContext = (client as any).patientContext || {};
      const response = await this.realtimeService.processMessage(text, patientContext);

      client.emit('text-part', {
        text: response,
        user: 'bot',
        id: Date.now()
      });

      client.emit('turn-completed');
    } catch (error) {
      this.logger.error('Error processing text message:', error);
      client.emit('error', { message: 'Failed to process message' });
    }
  }

  @SubscribeMessage('send-audio-chunk')
  async handleAudioChunk(client: Socket, chunk: any) {
    // For now, just acknowledge receipt
    // Audio processing would require additional setup
    client.emit('chunk-ack', { ok: true });

    if (chunk.final) {
      // Simulate transcription (in a real implementation, you'd process the audio)
      const simulatedTranscript = 'Audio message received (transcription not configured)';

      client.emit('text-part', {
        text: simulatedTranscript,
        user: 'user',
        id: Date.now()
      });

      // Process the message
      const patientContext = (client as any).patientContext || {};
      const response = await this.realtimeService.processMessage(simulatedTranscript, patientContext);

      client.emit('text-part', {
        text: response,
        user: 'bot',
        id: Date.now()
      });

      client.emit('turn-completed');
    }
  }

  @SubscribeMessage('end-session')
  handleEndSession(client: Socket) {
    this.logger.log(`Session ended for client: ${client.id}`);
    (client as any).patientContext = null;
    client.emit('session-closed');
  }
}