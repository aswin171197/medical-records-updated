import { Controller, Post, Put, Body, ValidationPipe, UseGuards, Request, Delete, Get, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
@Get('test')
async test() {
return 'hello' + process.env.DB_USERNAME 
}
  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    console.log('[CONTROLLER] Login successful, token generated');
    return result;
  }

  @Get('test-token')
  testToken(@Request() req: any) {
    const authHeader = req.headers.authorization;
    return {
      hasAuthHeader: !!authHeader,
      authHeaderPreview: authHeader ? authHeader.substring(0, 20) + '...' : 'None',
      message: 'This endpoint does not require authentication'
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(@Request() req: any, @Body() updateProfileDto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.userId, updateProfileDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: any) {
    try {
      console.log('[CONTROLLER] GET profile - User from JWT:', req.user);
      return await this.authService.getProfile(req.user.userId);
    } catch (error) {
      console.error('[CONTROLLER] Error in getProfile:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('profile')
  async deleteProfile(@Request() req: any) {
    try {
      console.log('[CONTROLLER] DELETE profile - User from JWT:', req.user);
      console.log('[CONTROLLER] DELETE profile - User ID:', req.user.userId);
      const result = await this.authService.deleteProfile(req.user.userId);
      console.log('[CONTROLLER] DELETE profile - Success:', result);
      return result;
    } catch (error: any) {
      console.error('[CONTROLLER] Error in deleteProfile:', error);
      console.error('[CONTROLLER] Error type:', error?.constructor?.name);
      console.error('[CONTROLLER] Error message:', error?.message);
      throw new HttpException(
        error?.message || 'Failed to delete account',
        error?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { mobile: string }) {
    return this.authService.forgotPassword(body.mobile);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { mobile: string; otp: string; newPassword: string }) {
    return this.authService.resetPassword(body.mobile, body.otp, body.newPassword);
  }

  @Post('send-otp-login')
  async sendOtpLogin(@Body() body: { mobile: string }) {
    return this.authService.sendOtpLogin(body.mobile);
  }

  @Post('verify-otp-login')
  async verifyOtpLogin(@Body() body: { mobile: string; otp: string }) {
    return this.authService.verifyOtpLogin(body.mobile, body.otp);
  }
}