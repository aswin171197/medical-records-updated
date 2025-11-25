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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcryptjs");
const user_entity_1 = require("../users/entities/user.entity");
const whatsapp_service_1 = require("../whatsapp/whatsapp.service");
let AuthService = class AuthService {
    constructor(userRepository, jwtService, whatsappService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.whatsappService = whatsappService;
    }
    async signup(signupDto) {
        const { email, name, password, mobile, dateOfBirth } = signupDto;
        const existingUser = await this.userRepository.findOne({ where: { email } });
        if (existingUser) {
            throw new common_1.ConflictException('User with this email already exists');
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
    async login(loginDto) {
        const { email, mobile, password } = loginDto;
        let user;
        if (email) {
            user = await this.userRepository.findOne({ where: { email } });
        }
        else if (mobile) {
            user = await this.userRepository.findOne({ where: { mobile } });
        }
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
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
    async getProfile(userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            dateOfBirth: user.dateOfBirth,
        };
    }
    async updateProfile(userId, updateProfileDto) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        if (updateProfileDto.name !== undefined)
            user.name = updateProfileDto.name;
        if (updateProfileDto.email !== undefined)
            user.email = updateProfileDto.email;
        if (updateProfileDto.mobile !== undefined)
            user.mobile = updateProfileDto.mobile;
        if (updateProfileDto.dateOfBirth !== undefined)
            user.dateOfBirth = updateProfileDto.dateOfBirth ? new Date(updateProfileDto.dateOfBirth) : null;
        await this.userRepository.save(user);
        return {
            message: 'Profile updated successfully',
            user,
        };
    }
    async deleteProfile(userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        await this.userRepository.delete({ id: userId });
        return { message: 'Account deleted successfully' };
    }
    async forgotPassword(mobile) {
        const user = await this.userRepository.findOne({ where: { mobile } });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await this.userRepository.update(user.id, {
            resetOtp: otp,
            resetOtpExpiry: otpExpiry
        });
        try {
            await this.whatsappService.sendTemplateMessage([mobile], otp);
        }
        catch (error) {
            console.error('Failed to send WhatsApp OTP for password reset:', error);
            throw new common_1.UnauthorizedException('Failed to send OTP');
        }
        return {
            message: 'Password reset OTP sent successfully to your WhatsApp'
        };
    }
    async resetPassword(mobile, otp, newPassword) {
        const user = await this.userRepository.findOne({ where: { mobile } });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        if (!user.resetOtp || user.resetOtp !== otp) {
            throw new common_1.UnauthorizedException('Invalid OTP');
        }
        if (!user.resetOtpExpiry || user.resetOtpExpiry < new Date()) {
            throw new common_1.UnauthorizedException('OTP has expired');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.userRepository.update(user.id, {
            password: hashedPassword,
            resetOtp: null,
            resetOtpExpiry: null
        });
        return { message: 'Password reset successfully' };
    }
    async sendOtpLogin(mobile) {
        const user = await this.userRepository.findOne({ where: { mobile } });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await this.userRepository.update(user.id, {
            loginOtp: otp,
            loginOtpExpiry: otpExpiry
        });
        try {
            await this.whatsappService.sendTemplateMessage([mobile], otp);
        }
        catch (error) {
            console.error('Failed to send WhatsApp OTP:', error);
            throw new common_1.UnauthorizedException('Failed to send OTP');
        }
        return { message: 'OTP sent successfully to your WhatsApp' };
    }
    async verifyOtpLogin(mobile, otp) {
        const user = await this.userRepository.findOne({ where: { mobile } });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        if (!user.loginOtp || user.loginOtp !== otp) {
            throw new common_1.UnauthorizedException('Invalid OTP');
        }
        if (!user.loginOtpExpiry || user.loginOtpExpiry < new Date()) {
            throw new common_1.UnauthorizedException('OTP has expired');
        }
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService,
        whatsapp_service_1.WhatsappService])
], AuthService);
//# sourceMappingURL=auth.service.js.map