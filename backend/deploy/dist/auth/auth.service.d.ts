import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { WhatsappService } from '../whatsapp/whatsapp.service';
export declare class AuthService {
    private readonly userRepository;
    private readonly jwtService;
    private readonly whatsappService;
    constructor(userRepository: Repository<User>, jwtService: JwtService, whatsappService: WhatsappService);
    signup(signupDto: SignupDto): Promise<{
        message: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        message: string;
        access_token: string;
        user: {
            id: number;
            name: string;
            email: string;
            mobile?: string;
            dateOfBirth?: Date;
        };
    }>;
    getProfile(userId: number): Promise<{
        id: number;
        name: string;
        email: string;
        mobile?: string;
        dateOfBirth?: Date;
    }>;
    updateProfile(userId: number, updateProfileDto: UpdateProfileDto): Promise<{
        message: string;
        user: User;
    }>;
    deleteProfile(userId: number): Promise<{
        message: string;
    }>;
    forgotPassword(mobile: string): Promise<{
        message: string;
    }>;
    resetPassword(mobile: string, otp: string, newPassword: string): Promise<{
        message: string;
    }>;
    sendOtpLogin(mobile: string): Promise<{
        message: string;
    }>;
    verifyOtpLogin(mobile: string, otp: string): Promise<{
        message: string;
        access_token: string;
        user: {
            id: number;
            name: string;
            email: string;
            mobile?: string;
            dateOfBirth?: Date;
        };
    }>;
}
