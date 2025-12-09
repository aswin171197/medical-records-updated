import { Injectable, Logger } from '@nestjs/common';
import { ChatbotService } from '../chatbot/services/chatbot.service';

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);

  constructor(private readonly chatbotService: ChatbotService) {}

  async processMessage(transcript: string, patientContext: any): Promise<string> {
    try {
      const payload = {
        patient_id: patientContext?.patientDetails?.id || patientContext?.patientDetails?.patient_id || '1',
        message: transcript,
        conversation_id: patientContext?.conversation_id || '',
        patient_context: patientContext || {},
        type: 'text' as const,
      };

      const response = await this.chatbotService.chatWithAi(payload);
      return response.data?.response || 'I apologize, but I couldn\'t process your message.';
    } catch (error) {
      this.logger.error('Error processing message:', error);
      return 'I apologize, but I encountered an error processing your message.';
    }
  }
}