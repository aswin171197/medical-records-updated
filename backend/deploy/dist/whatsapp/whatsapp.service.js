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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
let WhatsappService = class WhatsappService {
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
        this.API_URL = 'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/';
    }
    async sendTemplateMessage(phoneNumbers, urlTextValue) {
        const integratedNumber = this.configService.get('MSG91_WHATSAPP_INTEGRATED_NUMBER');
        const namespace = this.configService.get('MSG91_NAMESPACE');
        const apiKey = this.configService.get('MSG91_WHATSAPP_API_KEY');
        if (!integratedNumber || !namespace || !apiKey) {
            throw new common_1.HttpException('MSG91 credentials (integrated number, namespace, API key) are not configured', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        const modifiedPhoneNumber = phoneNumbers[0].replace(/^\+/, "").replace(/\D/g, "");
        const components = {
            body_1: {
                type: "text",
                value: urlTextValue
            },
            button_1: {
                type: "text",
                subtype: "url",
                value: urlTextValue
            }
        };
        const payload = {
            integrated_number: integratedNumber,
            content_type: "template",
            payload: {
                messaging_product: "whatsapp",
                type: "template",
                template: {
                    name: "otp_validation",
                    language: {
                        code: "en",
                        policy: "deterministic"
                    },
                    namespace,
                    to_and_components: [
                        {
                            to: [modifiedPhoneNumber],
                            components
                        }
                    ]
                }
            }
        };
        try {
            const headers = {
                'Content-Type': 'application/json',
                authkey: apiKey,
            };
            console.log('Sending WhatsApp payload:', JSON.stringify(payload, null, 2));
            const response = await (0, rxjs_1.lastValueFrom)(this.httpService.post('https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/', payload, { headers }));
            console.log('✅ WhatsApp message sent:', response.data);
            return response.data;
        }
        catch (error) {
            console.error('❌ Error sending WhatsApp message:', error?.response?.data || error.message);
            throw new common_1.HttpException(error?.response?.data || 'Failed to send WhatsApp message', error?.response?.status || common_1.HttpStatus.BAD_REQUEST);
        }
    }
};
exports.WhatsappService = WhatsappService;
exports.WhatsappService = WhatsappService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], WhatsappService);
//# sourceMappingURL=whatsapp.service.js.map