// backend/src/chatbot/services/v3-ai.service.ts
import { Injectable, Logger } from '@nestjs/common';
import {
  GoogleGenAI,
  LiveConnectConfig,
  LiveServerMessage,
  Modality,
  Session,
} from '@google/genai';

const BASE_PROMPT =
  'You are a medical AI assistant. Your primary role is to answer user questions using ONLY the provided patient medical context.\n\n' +
  'INSTRUCTIONS:\n' +
  '- When users ask about specific lab values (like RBC, hemoglobin, WBC, creatinine, etc.), provide the exact values, dates, reference ranges, and flags from their medical records.\n' +
  '- When users ask about symptoms, diagnoses, or treatments, reference the relevant medical records with dates.\n' +
  '- Always be specific and cite sources when possible.\n' +
  '- If information is not in the provided context, say "I don\'t have that information in your medical records."\n' +
  '- Never make up or guess information.\n' +
  '- Keep responses clear and medical-professional in tone.';

export interface GeminiLiveCallbacks {
  // keep the camelCase callbacks that the rest of your backend (BotGateway) uses
  onOpen: () => void;
  onMessage: (message: LiveServerMessage) => void;
  onError: (error: ErrorEvent | any) => void;
  onClose: (event: CloseEvent | any) => void;
}

@Injectable()
export class V3AiService {
  private readonly logger = new Logger(V3AiService.name);
  private readonly ai: GoogleGenAI;

  constructor() {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY environment variable not set.');
    }

    this.ai = new GoogleGenAI({
      apiKey: process.env.GOOGLE_API_KEY,
    });
  }

  /**
   * Create a live Gemini session.
   *
   * Note: we accept a GeminiLiveCallbacks object (camelCase),
   * then map it to the shape expected by the Google GenAI SDK
   * (onopen, onmessage, onerror, onclose) to satisfy typings.
   */
  async createLiveSession(
    callbacks: GeminiLiveCallbacks,
    type: 'bot' | 'apt',
    opts?: any,
  ): Promise<Session> {
    const model = process.env.GEMINI_MODEL || 'models/gemini-1.5-flash';

    const config = this.getAIConfig(opts?.medicalData);

    this.logger.debug('Calling createLiveSession with opts keys:', Object.keys(opts || {}));
    if (opts?.medicalData) {
      this.logger.debug('medicalData sample:', String(opts.medicalData).slice(0, 500));
    }
    this.logger.log(`[V3AiService] createLiveSession called with type: ${type}, medicalData length: ${opts?.medicalData?.length || 0}`);

    try {
      // Map camelCase callbacks -> lowercase callbacks that the SDK expects
      const sdkCallbacks = {
        onopen: () => {
          this.logger.log('[V3AiService] SDK onopen');
          try { callbacks.onOpen(); } catch (e) { this.logger.error('callback onOpen threw:', e); }
        },
        onmessage: (message: LiveServerMessage) => {
          // Optional logging of transcription if present
          try {
            if (message.serverContent?.inputTranscription?.text) {
              this.logger.log(`Input Transcription (server): ${message.serverContent.inputTranscription.text}`);
            }
            this.logger.debug('Gemini onmessage received (raw).');
            callbacks.onMessage(message);
          } catch (e) {
            this.logger.error('callback onMessage threw:', e);
          }
        },
        onerror: (error: ErrorEvent | any) => {
          this.logger.error('[V3AiService] SDK onerror', error);
          try { callbacks.onError(error); } catch (e) { this.logger.error('callback onError threw:', e); }
        },
        onclose: (event: CloseEvent | any) => {
          this.logger.log('[V3AiService] SDK onclose', event);
          try { callbacks.onClose(event); } catch (e) { this.logger.error('callback onClose threw:', e); }
        },
      };

      this.logger.log('[V3AiService] Calling ai.live.connect...');
      const session = await this.ai.live.connect({
        model,
        config,
        callbacks: sdkCallbacks as any, // cast because SDK expects its own LiveCallbacks shape
      });

      this.logger.log('[V3AiService] Successfully connected to Gemini Live session.');
      return session;
    } catch (error) {
      this.logger.error('[V3AiService] Failed to connect to Gemini Live session', error);
      throw error;
    }
  }

  /** Use full medicalData as systemInstruction */
  private getAIConfig(medicalData?: string): LiveConnectConfig {
    const MAX_PART_LEN = Number(process.env.MAX_SYSTEM_PART_CHARS || 15000);
    const systemParts: { text: string }[] = [];

    // Base system instruction
    systemParts.push({ text: BASE_PROMPT });

    if (medicalData) {
      let fullData = String(medicalData);

      // Truncate if too long, but keep as much as possible
      if (fullData.length > MAX_PART_LEN) {
        fullData = fullData.slice(0, MAX_PART_LEN) + '...[TRUNCATED DUE TO LENGTH LIMITS]';
      }

      const systemText = `COMPLETE PATIENT MEDICAL CONTEXT:\n\n${fullData}\n\nUse ALL the above medical data to answer user questions. Provide exact lab values, dates, reference ranges, and clinical details from the records.`;
      systemParts.push({ text: systemText });
    }

    const config: LiveConnectConfig = {
      responseModalities: [Modality.TEXT],
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      systemInstruction: systemParts.length ? { parts: systemParts } : undefined,
    };

    try {
      this.logger.debug(`getAIConfig: responseModalities=${config.responseModalities}, systemPartsCount=${systemParts.length}`);
      if (systemParts.length > 1) this.logger.debug(`systemPart length: ${systemParts[1].text.length}`);
    } catch {}

    return config;
  }
}
