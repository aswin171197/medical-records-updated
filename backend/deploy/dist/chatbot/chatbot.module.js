"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatbotModule = void 0;
const axios_1 = require("@nestjs/axios");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const bot_gateway_1 = require("./gateways/bot.gateway");
const v3_ai_service_1 = require("./services/v3-ai.service");
const chat_history_service_1 = require("./services/chat-history.service");
const chat_history_controller_1 = require("./controllers/chat-history.controller");
const chat_history_entity_1 = require("./entities/chat-history.entity");
let ChatbotModule = class ChatbotModule {
};
exports.ChatbotModule = ChatbotModule;
exports.ChatbotModule = ChatbotModule = __decorate([
    (0, common_1.Module)({
        imports: [
            axios_1.HttpModule,
            typeorm_1.TypeOrmModule.forFeature([chat_history_entity_1.ChatHistory])
        ],
        controllers: [chat_history_controller_1.ChatHistoryController],
        providers: [
            v3_ai_service_1.V3AiService,
            chat_history_service_1.ChatHistoryService,
            bot_gateway_1.BotGateway,
        ],
    })
], ChatbotModule);
//# sourceMappingURL=chatbot.module.js.map