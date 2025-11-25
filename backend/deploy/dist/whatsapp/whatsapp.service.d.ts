import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
export declare class WhatsappService {
    private readonly httpService;
    private readonly configService;
    private readonly API_URL;
    constructor(httpService: HttpService, configService: ConfigService);
    sendTemplateMessage(phoneNumbers: string[], urlTextValue: string): Promise<any>;
}
