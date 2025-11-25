import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/entities/user.entity';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly whatsappService: WhatsappService,
  ) {}

  async signup(signupDto: SignupDto): Promise<{ message: string }> {
    const { email, name, password, mobile, dateOfBirth } = signupDto;

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      email,
      name,
      password: hashedPassword,
      mobile,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    });

    await this.userRepository.save(user);

    return { message: 'User registered successfully' };
  }

  async login(loginDto: LoginDto): Promise<{ message: string; access_token: string; user: { id: number; name: string; email: string; mobile?: string; dateOfBirth?: Date } }> {
    const { email, mobile, password } = loginDto;

    // Find user by email or mobile
    let user;
    if (email) {
      user = await this.userRepository.findOne({ where: { email } });
    } else if (mobile) {
      user = await this.userRepository.findOne({ where: { mobile } });
    }

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user.id };
    const access_token = this.jwtService.sign(payload);

    return {
      message: `Welcome home, ${user.name}!`,
      access_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        dateOfBirth: user.dateOfBirth,
      },
    };
  }

  async getProfile(userId: number): Promise<{ id: number; name: string; email: string; mobile?: string; dateOfBirth?: Date }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      dateOfBirth: user.dateOfBirth,
    };
  }

  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto): Promise<{ message: string; user: User }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (updateProfileDto.name !== undefined) user.name = updateProfileDto.name;
    if (updateProfileDto.email !== undefined) user.email = updateProfileDto.email;
    if (updateProfileDto.mobile !== undefined) user.mobile = updateProfileDto.mobile;
    if (updateProfileDto.dateOfBirth !== undefined) user.dateOfBirth = updateProfileDto.dateOfBirth ? new Date(updateProfileDto.dateOfBirth) : null;

    await this.userRepository.save(user);

    return {
      message: 'Profile updated successfully',
      user,
    };
  }

  async deleteProfile(userId: number): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.userRepository.delete({ id: userId });
    return { message: 'Account deleted successfully' };
  }

  async forgotPassword(mobile: string) {
    const user = await this.userRepository.findOne({ where: { mobile } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await this.userRepository.update(user.id, {
      resetOtp: otp,
      resetOtpExpiry: otpExpiry
    });

    // Send OTP via WhatsApp
    try {
      await this.whatsappService.sendTemplateMessage([mobile], otp);
    } catch (error) {
      console.error('Failed to send WhatsApp OTP for password reset:', error);
      throw new UnauthorizedException('Failed to send OTP');
    }

    return {
      message: 'Password reset OTP sent successfully to your WhatsApp'
    };
  }

  async resetPassword(mobile: string, otp: string, newPassword: string) {
    const user = await this.userRepository.findOne({ where: { mobile } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.resetOtp || user.resetOtp !== otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    if (!user.resetOtpExpiry || user.resetOtpExpiry < new Date()) {
      throw new UnauthorizedException('OTP has expired');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(user.id, {
      password: hashedPassword,
      resetOtp: null,
      resetOtpExpiry: null
    });

    return { message: 'Password reset successfully' };
  }

  async sendOtpLogin(mobile: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { mobile } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.userRepository.update(user.id, {
      loginOtp: otp,
      loginOtpExpiry: otpExpiry
    });

    // Send OTP via WhatsApp
    try {
      await this.whatsappService.sendTemplateMessage([mobile], otp);
    } catch (error) {
      console.error('Failed to send WhatsApp OTP:', error);
      throw new UnauthorizedException('Failed to send OTP');
    }

    return { message: 'OTP sent successfully to your WhatsApp' };
  }

  async verifyOtpLogin(mobile: string, otp: string): Promise<{ message: string; access_token: string; user: { id: number; name: string; email: string; mobile?: string; dateOfBirth?: Date } }> {
    const user = await this.userRepository.findOne({ where: { mobile } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.loginOtp || user.loginOtp !== otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    if (!user.loginOtpExpiry || user.loginOtpExpiry < new Date()) {
      throw new UnauthorizedException('OTP has expired');
    }

    // Clear OTP after successful verification
    await this.userRepository.update(user.id, {
      loginOtp: null,
      loginOtpExpiry: null
    });

    const payload = { email: user.email, sub: user.id };
    const access_token = this.jwtService.sign(payload);

    return {
      message: `Welcome back, ${user.name}!`,
      access_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        dateOfBirth: user.dateOfBirth,
      },
    };
  }
}