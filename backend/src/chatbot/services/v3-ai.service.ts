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
  'You are a medical AI assistant. Use ONLY the provided patient context. ' +
  'If a value or report is not found, say so. Never guess.';

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
    const model = process.env.GEMINI_MODEL || 'models/gemini-2.0-flash-exp';

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

  /** Summarize/truncate medicalData and attach as systemInstruction */
  private getAIConfig(medicalData?: string): LiveConnectConfig {
    const MAX_PART_LEN = Number(process.env.MAX_SYSTEM_PART_CHARS || 14000);
    const systemParts: { text: string }[] = [];

    // Base system instruction
    const baseInstruction =
      BASE_PROMPT +
      '\nYou are a medical assistant. Provide evidence-based, careful answers and cite the record/file and date when referencing lab values or imaging impressions.';
    systemParts.push({ text: baseInstruction });

    if (medicalData) {
      let summary = '';
      try {
        // Try JSON summarization if possible
        const parsed = JSON.parse(medicalData);
        if (Array.isArray(parsed)) {
          const recCount = parsed.length;
          const topLines = parsed.slice(0, 5).map((r: any, i: number) => {
            const title = r.title || r.fileName || `Record ${i + 1}`;
            const invCount = (r.extractedData?.investigations?.length ?? r.extraction?.investigations?.length) || 0;
            const imgCount = (r.extractedData?.imaging_radiology_reports?.length ?? r.extraction?.imaging_radiology_reports?.length) || 0;
            return `- ${title}: ${invCount} lab tests, ${imgCount} imaging reports`;
          }).join('\n');
          summary = `Patient has ${recCount} extracted medical records. Top records:\n${topLines}`;
        } else if (typeof parsed === 'object') {
          const keys = Object.keys(parsed).slice(0, 20);
          const invCount = parsed.investigations?.length ?? 0;
          const imgCount = parsed.imaging_radiology_reports?.length ?? 0;
          summary = `Structured record: ${invCount} lab tests, ${imgCount} imaging reports. Keys: ${keys.join(', ')}`;
        } else {
          summary = String(parsed).slice(0, 1000);
        }
      } catch (e) {
        // not JSON, use text slice
        summary = String(medicalData).slice(0, 12000);
      }

      if (!summary) summary = String(medicalData).slice(0, 12000);
      if (summary.length > MAX_PART_LEN) summary = summary.slice(0, MAX_PART_LEN) + '...[TRUNCATED]';

      const systemText = `USE THIS PATIENT CONTEXT CAREFULLY:\n${summary}\n\nIf the user asks for specific lab values or imaging impressions, answer using only the information above and when possible mention the record/file and date. If data is not present, say you could not find it in the provided records.`;
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
      if (systemParts.length > 1) this.logger.debug(`systemPart sample: ${systemParts[1].text.slice(0, 400)}`);
    } catch {}

    return config;
  }
}
