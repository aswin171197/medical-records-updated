import { Controller, Post, Body } from '@nestjs/common';
import { ChatbotService } from '../services/chatbot.service';

@Controller('auth')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    // Mock authentication for testing
    if (body.email && body.password) {
      return {
        access_token: 'mock-jwt-token-for-testing',
        user: {
          id: 1,
          email: body.email,
          name: 'Test User'
        }
      };
    }
    throw new Error('Invalid credentials');
  }
}