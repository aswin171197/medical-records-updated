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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatHistoryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const chat_history_entity_1 = require("../entities/chat-history.entity");
let ChatHistoryService = class ChatHistoryService {
    constructor(chatHistoryRepository) {
        this.chatHistoryRepository = chatHistoryRepository;
    }
    async saveMessage(userId, message, role, sessionId, timestamp) {
        const chatHistory = this.chatHistoryRepository.create({
            userId,
            message,
            role,
            sessionId,
            timestamp: timestamp || new Date(),
        });
        return this.chatHistoryRepository.save(chatHistory);
    }
    async getChatHistory(userId, limit = 50) {
        return this.chatHistoryRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }
    async getChatHistoryBySession(userId, sessionId) {
        const whereCondition = sessionId === 'default-session'
            ? { userId, sessionId: null }
            : { userId, sessionId };
        return this.chatHistoryRepository.find({
            where: whereCondition,
            order: { createdAt: 'ASC' },
        });
    }
    async getChatSessions(userId) {
        const messages = await this.chatHistoryRepository.find({
            where: { userId },
            select: ['sessionId', 'timestamp', 'createdAt'],
            order: { createdAt: 'DESC' },
        });
        const sessionMap = new Map();
        messages.forEach(msg => {
            const sessionKey = msg.sessionId || 'default-session';
            const messageTime = msg.timestamp || msg.createdAt;
            if (!sessionMap.has(sessionKey)) {
                sessionMap.set(sessionKey, {
                    sessionId: sessionKey,
                    createdAt: msg.createdAt,
                    messageCount: 0,
                    lastMessage: messageTime
                });
            }
            const session = sessionMap.get(sessionKey);
            session.messageCount++;
            if (messageTime > session.lastMessage) {
                session.lastMessage = messageTime;
            }
        });
        return Array.from(sessionMap.values()).sort((a, b) => b.lastMessage.getTime() - a.lastMessage.getTime());
    }
    async deleteChatHistory(userId) {
        await this.chatHistoryRepository.delete({ userId });
    }
    async deleteChatSession(userId, sessionId) {
        await this.chatHistoryRepository.delete({ userId, sessionId });
    }
};
exports.ChatHistoryService = ChatHistoryService;
exports.ChatHistoryService = ChatHistoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(chat_history_entity_1.ChatHistory)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ChatHistoryService);
//# sourceMappingURL=chat-history.service.js.map