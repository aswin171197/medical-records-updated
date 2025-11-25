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
var BotGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const v3_ai_service_1 = require("../services/v3-ai.service");
let BotGateway = BotGateway_1 = class BotGateway {
    constructor(geminiLiveService) {
        this.geminiLiveService = geminiLiveService;
        this.logger = new common_1.Logger(BotGateway_1.name);
        this.connections = new Map();
        this.emitCache = new Map();
        this.medicalDataStore = new Map();
    }
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
        const geminiSession = this.connections.get(client.id);
        if (geminiSession) {
            try {
                geminiSession.close();
            }
            catch (e) {
            }
            this.connections.delete(client.id);
            this.emitCache.delete(client.id);
            this.logger.log(`Gemini session closed and removed for client: ${client.id}`);
        }
    }
    async startSession(client, opts = {}) {
        this.logger.log(`Client ${client.id} requested start-session. raw opts keys: ${Object.keys(opts).join(', ')}`);
        try {
            if (opts.medicalData !== undefined) {
                if (typeof opts.medicalData !== 'string') {
                    this.logger.warn(`Client ${client.id} start-session rejected: medicalData is not a string`);
                    client.emit('session-error', { message: 'Invalid argument: medicalData must be a string' });
                    return;
                }
                const len = opts.medicalData.length;
                this.logger.log(`Client ${client.id} medicalData length: ${len}`);
                if (len === 0) {
                    delete opts.medicalData;
                }
            }
            if (this.connections.has(client.id)) {
                this.logger.warn(`Client ${client.id} already has an active session.`);
                client.emit('session-error', { message: 'Session already active.' });
                return;
            }
            this.logger.log(`Starting Gemini session for client: ${client.id}`);
            const medicalData = opts?.medicalData;
            if (medicalData) {
                this.medicalDataStore.set(client.id, medicalData);
                this.logger.log(`Stored medical data for client ${client.id}, length: ${medicalData.length}`);
            }
            const geminiSession = await this.geminiLiveService.createLiveSession({
                onOpen: () => {
                    this.logger.log(`Gemini session opened for client: ${client.id}`);
                    this.emitCache.set(client.id, new Set());
                    client.emit('session-started');
                },
                onMessage: async (message) => {
                    if (message)
                        this.handleGeminiMessage(client, message);
                },
                onError: (error) => {
                    this.logger.error(`Gemini session error for client ${client.id}: ${error?.message || JSON.stringify(error)}`);
                    client.emit('session-error', { message: error?.message || 'Gemini error' });
                    this.connections.delete(client.id);
                    this.emitCache.delete(client.id);
                    this.medicalDataStore.delete(client.id);
                },
                onClose: (event) => {
                    this.logger.log(`Gemini session closed for client ${client.id}: ${event?.reason}`);
                    client.emit('session-closed', { reason: event?.reason });
                    this.connections.delete(client.id);
                    this.emitCache.delete(client.id);
                    this.medicalDataStore.delete(client.id);
                },
            }, 'bot', opts);
            this.connections.set(client.id, geminiSession);
        }
        catch (error) {
            this.logger.error(`Failed to start Gemini session for client ${client.id}: ${error?.message || error}`, error);
            client.emit('session-error', {
                message: 'Failed to initiate Gemini session: ' + (error?.message || 'unknown'),
            });
        }
    }
    async startAptSession(client) {
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
                    this.emitCache.set(client.id, new Set());
                    client.emit('session-started');
                },
                onMessage: async (message) => {
                    if (message)
                        this.handleGeminiMessage(client, message);
                },
                onError: (error) => {
                    this.logger.error(`Gemini session error for client ${client.id}: ${error?.message || JSON.stringify(error)}`);
                    client.emit('session-error', { message: error?.message || 'Gemini error' });
                    this.connections.delete(client.id);
                    this.emitCache.delete(client.id);
                },
                onClose: (event) => {
                    this.logger.log(`Gemini session closed for client ${client.id}: ${event?.reason}`);
                    client.emit('session-closed', { reason: event?.reason });
                    this.connections.delete(client.id);
                    this.emitCache.delete(client.id);
                },
            }, 'apt');
            this.connections.set(client.id, geminiSession);
        }
        catch (error) {
            this.logger.error(`Failed to start Gemini apt session for client ${client.id}:`, error);
            client.emit('session-error', {
                message: 'Failed to initiate Gemini session.',
            });
        }
    }
    handleTextMessage(client, text) {
        const geminiSession = this.connections.get(client.id);
        if (geminiSession) {
            this.logger.log(`Sending text from client ${client.id}: "${text}"`);
            try {
                geminiSession.sendClientContent({ turns: [text] });
            }
            catch (e) {
                this.logger.error('sendClientContent error', e);
                client.emit('session-error', { message: 'Failed to send text to Gemini' });
            }
        }
        else {
            this.logger.warn(`Client ${client.id} tried to send text without a session.`);
            client.emit('session-error', { message: 'No active session.' });
        }
    }
    handleAudioChunk(client, audioData) {
        const geminiSession = this.connections.get(client.id);
        try {
            const b64len = typeof audioData.data === 'string' ? audioData.data.length : 0;
            this.logger.debug(`recv audio chunk from ${client.id}: mime=${audioData.mimeType} final=${!!audioData.final} bytes(base64)=${b64len}`);
        }
        catch (e) {
            this.logger.debug(`recv audio chunk from ${client.id}: (could not measure size)`);
        }
        if (geminiSession) {
            const inputData = { data: audioData.data, mimeType: audioData.mimeType };
            if (typeof audioData.final !== 'undefined')
                inputData.final = !!audioData.final;
            try {
                geminiSession.sendRealtimeInput({ media: inputData });
            }
            catch (e) {
                this.logger.error('sendRealtimeInput error', e);
                client.emit('session-error', { message: 'Failed to forward audio to Gemini' });
            }
        }
        else {
            this.logger.warn(`Client ${client.id} tried to send audio without a session.`);
            client.emit('session-error', { message: 'No active session.' });
        }
    }
    handleGeminiMessage(client, message) {
        try {
            const serialized = JSON.stringify(message);
            const preview = serialized.length > 2000 ? serialized.slice(0, 2000) + '...[truncated]' : serialized;
            this.logger.debug(`Gemini message for ${client.id}: ${preview}`);
        }
        catch (e) {
            this.logger.debug(`Gemini message for ${client.id} received (couldn't stringify)`);
        }
        if (!message?.serverContent) {
            this.logger.warn(`No serverContent in message for ${client.id}`);
            return;
        }
        const serverContent = message.serverContent;
        const stableId = serverContent?.id ??
            serverContent?.messageId ??
            serverContent?.turnId ??
            (serverContent?.outputTranscription?.text ? `txt:${serverContent.outputTranscription.text.slice(0, 200)}` : undefined) ??
            JSON.stringify(serverContent).slice(0, 200);
        const cache = this.emitCache.get(client.id) ?? new Set();
        if (cache.has(String(stableId))) {
            this.logger.debug(`Skipping duplicate serverContent for ${client.id}, id=${String(stableId).slice(0, 60)}`);
            return;
        }
        cache.add(String(stableId));
        this.emitCache.set(client.id, cache);
        const part = serverContent?.modelTurn?.parts?.[0];
        if (part?.inlineData && part.inlineData.data) {
            this.logger.debug(`Emitting audio-part to ${client.id} id=${stableId}`);
            client.emit('audio-part', {
                id: stableId,
                audio: { data: part.inlineData.data, mimeType: part.inlineData.mimeType || 'audio/mpeg' },
            });
        }
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
        if (part?.text) {
            this.logger.log(`Bot said text (${client.id}): "${part.text}"`);
            client.emit('text-part', {
                id: stableId + '-text',
                text: part.text,
                user: 'bot',
                timestamp: Date.now(),
            });
        }
        const inputTranscription = serverContent?.inputTranscription;
        if (inputTranscription?.text) {
            this.logger.log(`User said (${client.id}): "${inputTranscription.text.substring(0, 200)}"`);
            client.emit('text-part', {
                id: `${stableId}-input`,
                text: inputTranscription.text,
                user: 'user',
                timestamp: Date.now(),
            });
        }
        if (serverContent?.turnComplete) {
            this.logger.debug(`Turn completed for ${client.id}, id=${stableId}`);
            client.emit('turn-completed', { id: stableId });
        }
        if (serverContent?.interrupted) {
            this.logger.debug(`Turn interrupted for ${client.id}, id=${stableId}`);
            client.emit('turn-interrupted', { id: stableId });
        }
    }
    handleEndSession(client) {
        this.logger.log(`Client ${client.id} requested session end.`);
        this.handleDisconnect(client);
    }
};
exports.BotGateway = BotGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], BotGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('start-session'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], BotGateway.prototype, "startSession", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('start-apt-session'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], BotGateway.prototype, "startAptSession", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send-text'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], BotGateway.prototype, "handleTextMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send-audio-chunk'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], BotGateway.prototype, "handleAudioChunk", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('end-session'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], BotGateway.prototype, "handleEndSession", null);
exports.BotGateway = BotGateway = BotGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [v3_ai_service_1.V3AiService])
], BotGateway);
//# sourceMappingURL=bot.gateway.js.map