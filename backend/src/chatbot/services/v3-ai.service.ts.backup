// src/services/v3-ai.service.ts
import { Injectable, Logger } from '@nestjs/common';
import {
  GoogleGenAI,
  LiveConnectConfig,
  LiveServerMessage,
  MediaResolution,
  Modality,
  Session,
} from '@google/genai';
// Assuming GEMINI_PROMPT is defined elsewhere
// import { GEMINI_PROMPT } from '../_ai-prompts/gemini-prompt.const'; 

// Placeholder for external constant to make this example runnable
const GEMINI_PROMPT = 'You are a helpful and friendly AI assistant.'; 

export interface GeminiLiveCallbacks {
  onMessage: (message: LiveServerMessage) => void;
  onError: (error: ErrorEvent) => void;
  onClose: (event: CloseEvent) => void;
  onOpen: () => void;
}

@Injectable()
export class V3AiService {
  private readonly logger = new Logger(V3AiService.name);
  private readonly ai: GoogleGenAI;

  constructor() {
    // The Gemini Live API generally requires a robust model
    // which may default to a Vertex AI endpoint depending on your setup.
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY environment variable not set.');
    }
    this.ai = new GoogleGenAI({
      apiKey: process.env.GOOGLE_API_KEY,
    });
  }

  async createLiveSession(
    callbacks: GeminiLiveCallbacks,
    type: 'bot' | 'apt',
    opts?: any,
  ): Promise<Session> {
    this.logger.debug('Calling createLiveSession with opts keys:', Object.keys(opts || {}));
    if (opts?.medicalData) {
      this.logger.debug('medicalData sample:', opts.medicalData.slice(0, 500));
    }
    this.logger.log(`[V3AiService] createLiveSession called with type: ${type}, medicalData length: ${opts?.medicalData?.length || 0}`);
    // Note: 'models/gemini-2.0-flash-live-001' is a previous version.
    // The recommended model for native audio is often
    // 'gemini-2.5-flash-native-audio-preview-09-2025' or similar.
    const model = 'models/gemini-2.0-flash-exp';

    const config: LiveConnectConfig = this.getAIConfig(type, opts?.medicalData);

    this.logger.log('[V3AiService] Connecting to Gemini model with config:');
    try {
      this.logger.log(
        JSON.stringify(
          {
            responseModalities: config.responseModalities,
            mediaResolution: config.mediaResolution,
            speechConfig: config.speechConfig,
            contextWindowCompression: config.contextWindowCompression,
            systemInstruction: typeof config.systemInstruction === 'object' && 'parts' in config.systemInstruction
              ? {
                  parts: config.systemInstruction.parts.map(part => ({
                    text: part.text.substring(0, 500) + (part.text.length > 500 ? '...[truncated]' : '')
                  }))
                }
              : config.systemInstruction,
            // Only logging the presence of the transcription objects
            inputAudioTranscription: !!config.inputAudioTranscription,
            outputAudioTranscription: !!config.outputAudioTranscription,
            hasMedicalData: !!opts?.medicalData,
          },
          null,
          2,
        ),
      );
    } catch {
      this.logger.debug('Could not stringify config for logging.');
    }

    try {
      this.logger.log('[V3AiService] Calling ai.live.connect...');
      const session = await this.ai.live.connect({
        model,
        config,
        callbacks: {
          onopen: () => {
            this.logger.log('[V3AiService] Gemini session opened successfully.');
            callbacks.onOpen();
          },
          onmessage: (message: LiveServerMessage) => {
            // Log the transcribed text when received
            if (message.serverContent?.inputTranscription?.text) {
                this.logger.log(`Input Transcription: ${message.serverContent.inputTranscription.text}`);
            }
            this.logger.debug('Gemini onmessage received (raw).');
            callbacks.onMessage(message);
          },
          onerror: (error: ErrorEvent) => {
            this.logger.error('[V3AiService] Gemini session error:', error);
            callbacks.onError(error);
          },
          onclose: (event: CloseEvent) => {
            this.logger.log('[V3AiService] Gemini session closed:', event);
            callbacks.onClose(event);
          },
        },
      });

      this.logger.log('[V3AiService] Successfully connected to Gemini Live session.');
      return session;
    } catch (error) {
      this.logger.error('[V3AiService] Failed to connect to Gemini Live session', error);
      throw error;
    }
  }

  // --- 🎯 The Fix is here ---
  private getAIConfig(type: 'bot' | 'apt', medicalData?: string): LiveConnectConfig {
    return {
      responseModalities: [Modality.TEXT],
      inputAudioTranscription: {},
      systemInstruction: medicalData ? {
        parts: [
          {
            text: `You are a helpful AI health assistant. You have access to the user's medical data. Use it to answer questions about their health data.\n\nMedical Data:\n\n${medicalData}`,
          },
        ],
      } : undefined,
    };
  }
}