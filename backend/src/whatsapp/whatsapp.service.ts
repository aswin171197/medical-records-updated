import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class WhatsappService {
  private readonly API_URL =
    'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Send WhatsApp template message via MSG91 API
   * @param phoneNumbers List of phone numbers to send message to
   * @param urlTextValue Dynamic URL value (if applicable)
   * @returns Response from MSG91 API
   */
  async sendTemplateMessage(
    phoneNumbers: string[],
    urlTextValue: string,
  ): Promise<any> {
    const integratedNumber = this.configService.get<string>('MSG91_WHATSAPP_INTEGRATED_NUMBER');
    const namespace = this.configService.get<string>('MSG91_NAMESPACE');
    const apiKey = this.configService.get<string>('MSG91_WHATSAPP_API_KEY');

    if (!integratedNumber || !namespace || !apiKey) {
      throw new HttpException('MSG91 credentials (integrated number, namespace, API key) are not configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Format phone number - remove + and non-digits
    const modifiedPhoneNumber = phoneNumbers[0].replace(/^\+/, "").replace(/\D/g, "");

    // Build components for OTP template
    const components: Record<string, any> = {
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

      const response = await lastValueFrom(
        this.httpService.post('https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/', payload, { headers }),
      );

      console.log('✅ WhatsApp message sent:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error sending WhatsApp message:', error?.response?.data || error.message);
      throw new HttpException(
        error?.response?.data || 'Failed to send WhatsApp message',
        error?.response?.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
}