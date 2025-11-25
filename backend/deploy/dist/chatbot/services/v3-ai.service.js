"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var V3AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.V3AiService = void 0;
const common_1 = require("@nestjs/common");
const genai_1 = require("@google/genai");
const GEMINI_PROMPT = 'You are a helpful and friendly AI assistant.';
let V3AiService = V3AiService_1 = class V3AiService {
    constructor() {
        this.logger = new common_1.Logger(V3AiService_1.name);
        if (!process.env.GOOGLE_API_KEY) {
            throw new Error('GOOGLE_API_KEY environment variable not set.');
        }
        this.ai = new genai_1.GoogleGenAI({
            apiKey: process.env.GOOGLE_API_KEY,
        });
    }
    async createLiveSession(callbacks, type, opts) {
        this.logger.debug('Calling createLiveSession with opts keys:', Object.keys(opts || {}));
        if (opts?.medicalData) {
            this.logger.debug('medicalData sample:', opts.medicalData.slice(0, 500));
        }
        this.logger.log(`[V3AiService] createLiveSession called with type: ${type}, medicalData length: ${opts?.medicalData?.length || 0}`);
        const model = 'models/gemini-2.0-flash-exp';
        const config = this.getAIConfig(type, opts?.medicalData);
        this.logger.log('[V3AiService] Connecting to Gemini model with config:');
        try {
            this.logger.log(JSON.stringify({
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
                inputAudioTranscription: !!config.inputAudioTranscription,
                outputAudioTranscription: !!config.outputAudioTranscription,
                hasMedicalData: !!opts?.medicalData,
            }, null, 2));
        }
        catch {
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
                    onmessage: (message) => {
                        if (message.serverContent?.inputTranscription?.text) {
                            this.logger.log(`Input Transcription: ${message.serverContent.inputTranscription.text}`);
                        }
                        this.logger.debug('Gemini onmessage received (raw).');
                        callbacks.onMessage(message);
                    },
                    onerror: (error) => {
                        this.logger.error('[V3AiService] Gemini session error:', error);
                        callbacks.onError(error);
                    },
                    onclose: (event) => {
                        this.logger.log('[V3AiService] Gemini session closed:', event);
                        callbacks.onClose(event);
                    },
                },
            });
            this.logger.log('[V3AiService] Successfully connected to Gemini Live session.');
            return session;
        }
        catch (error) {
            this.logger.error('[V3AiService] Failed to connect to Gemini Live session', error);
            throw error;
        }
    }
    getAIConfig(type, medicalData) {
        return {
            responseModalities: [genai_1.Modality.TEXT],
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
};
exports.V3AiService = V3AiService;
exports.V3AiService = V3AiService = V3AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], V3AiService);
//# sourceMappingURL=v3-ai.service.js.map