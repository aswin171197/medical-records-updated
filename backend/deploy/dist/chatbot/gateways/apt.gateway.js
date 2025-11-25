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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AptGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AptGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const v3_ai_service_1 = require("../services/v3-ai.service");
let AptGateway = AptGateway_1 = class AptGateway {
    constructor(v3AiService) {
        this.v3AiService = v3AiService;
        this.logger = new common_1.Logger(AptGateway_1.name);
        this.connections = new Map();
    }
    handleConnection(client) {
        this.logger.log(`APT client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`APT client disconnected: ${client.id}`);
        const geminiSession = this.connections.get(client.id);
        if (geminiSession) {
            geminiSession.close();
            this.connections.delete(client.id);
            this.logger.log(`Gemini session closed and removed for APT client: ${client.id}`);
        }
    }
    async startAptSession(client) {
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
                onMessage: async (message) => {
                    if (message) {
                        this.handleGeminiMessage(client, message);
                    }
                    else {
                        await new Promise((resolve) => setTimeout(resolve, 100));
                    }
                },
                onError: (error) => {
                    this.logger.error(`Gemini session error for APT client ${client.id}:`, error.message);
                    client.emit('session-error', { message: error.message });
                    this.connections.delete(client.id);
                },
                onClose: (event) => {
                    this.logger.log(`Gemini session closed for APT client ${client.id}: ${event.reason}`);
                    client.emit('session-closed', { reason: event.reason });
                    this.connections.delete(client.id);
                },
            }, 'apt');
            this.connections.set(client.id, geminiSession);
        }
        catch (error) {
            this.logger.error(`Failed to start Gemini session for APT client ${client.id}:`, error);
            client.emit('session-error', {
                message: 'Failed to initiate Gemini session.',
            });
        }
    }
    handleTextMessage(client, text) {
        const geminiSession = this.connections.get(client.id);
        if (geminiSession) {
            this.logger.log(`Sending text from APT client ${client.id}: "${text}"`);
            geminiSession.sendClientContent({ turns: [text] });
        }
        else {
            this.logger.warn(`APT client ${client.id} tried to send text without a session.`);
            client.emit('session-error', { message: 'No active session.' });
        }
    }
    handleAudioChunk(client, audioData) {
        const geminiSession = this.connections.get(client.id);
        if (geminiSession) {
            geminiSession.sendRealtimeInput({
                media: audioData
            });
        }
        else {
            this.logger.warn(`APT client ${client.id} tried to send audio without a session.`);
            client.emit('session-error', { message: 'No active session.' });
        }
    }
    handleGeminiMessage(client, message) {
        if (message.serverContent) {
            const part = message.serverContent?.modelTurn?.parts?.[0];
            if (part?.inlineData) {
                client.emit('audio-part', {
                    audio: {
                        data: part.inlineData.data,
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
                if (inputTranscription?.text) {
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
    handleEndSession(client) {
        this.logger.log(`APT client ${client.id} requested to end the session.`);
        this.handleDisconnect(client);
    }
};
exports.AptGateway = AptGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], AptGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('start-session'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], AptGateway.prototype, "startAptSession", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send-text'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], AptGateway.prototype, "handleTextMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send-audio-chunk'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], AptGateway.prototype, "handleAudioChunk", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('end-session'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], AptGateway.prototype, "handleEndSession", null);
exports.AptGateway = AptGateway = AptGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
            credentials: true,
        },
        namespace: '/apt',
    }),
    __metadata("design:paramtypes", [v3_ai_service_1.V3AiService])
], AptGateway);
//# sourceMappingURL=apt.gateway.js.map