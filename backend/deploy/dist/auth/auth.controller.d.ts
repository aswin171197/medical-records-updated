import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    test(): Promise<string>;
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
    testToken(req: any): {
        hasAuthHeader: boolean;
        authHeaderPreview: string;
        message: string;
    };
    updateProfile(req: any, updateProfileDto: UpdateProfileDto): Promise<{
        message: string;
        user: import("../users/entities/user.entity").User;
    }>;
    getProfile(req: any): Promise<{
        id: number;
        name: string;
        email: string;
        mobile?: string;
        dateOfBirth?: Date;
    }>;
    deleteProfile(req: any): Promise<{
        message: string;
    }>;
    forgotPassword(body: {
        mobile: string;
    }): Promise<{
        message: string;
    }>;
    resetPassword(body: {
        mobile: string;
        otp: string;
        newPassword: string;
    }): Promise<{
        message: string;
    }>;
    sendOtpLogin(body: {
        mobile: string;
    }): Promise<{
        message: string;
    }>;
    verifyOtpLogin(body: {
        mobile: string;
        otp: string;
    }): Promise<{
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
