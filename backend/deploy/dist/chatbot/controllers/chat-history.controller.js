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
exports.ChatHistoryController = void 0;
const common_1 = require("@nestjs/common");
const chat_history_service_1 = require("../services/chat-history.service");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
let ChatHistoryController = class ChatHistoryController {
    constructor(chatHistoryService) {
        this.chatHistoryService = chatHistoryService;
    }
    async saveMessage(body, req) {
        const userId = req.user.id;
        const timestamp = body.timestamp ? new Date(body.timestamp) : new Date();
        return this.chatHistoryService.saveMessage(userId, body.message, body.role, body.sessionId, timestamp);
    }
    async getChatHistory(req) {
        const userId = req.user.id;
        return this.chatHistoryService.getChatHistory(userId);
    }
    async getChatSessions(req) {
        const userId = req.user.id;
        return this.chatHistoryService.getChatSessions(userId);
    }
    async getChatHistoryBySession(sessionId, req) {
        const userId = req.user.id;
        return this.chatHistoryService.getChatHistoryBySession(userId, sessionId);
    }
    async deleteChatHistory(req) {
        const userId = req.user.id;
        await this.chatHistoryService.deleteChatHistory(userId);
        return { message: 'Chat history deleted successfully' };
    }
    async deleteChatSession(sessionId, req) {
        const userId = req.user.id;
        await this.chatHistoryService.deleteChatSession(userId, sessionId);
        return { message: 'Chat session deleted successfully' };
    }
};
exports.ChatHistoryController = ChatHistoryController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatHistoryController.prototype, "saveMessage", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatHistoryController.prototype, "getChatHistory", null);
__decorate([
    (0, common_1.Get)('sessions'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatHistoryController.prototype, "getChatSessions", null);
__decorate([
    (0, common_1.Get)('session/:sessionId'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ChatHistoryController.prototype, "getChatHistoryBySession", null);
__decorate([
    (0, common_1.Delete)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatHistoryController.prototype, "deleteChatHistory", null);
__decorate([
    (0, common_1.Delete)('session/:sessionId'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ChatHistoryController.prototype, "deleteChatSession", null);
exports.ChatHistoryController = ChatHistoryController = __decorate([
    (0, common_1.Controller)('chat-history'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [chat_history_service_1.ChatHistoryService])
], ChatHistoryController);
//# sourceMappingURL=chat-history.controller.js.map