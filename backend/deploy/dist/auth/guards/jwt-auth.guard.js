"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
let JwtAuthGuard = class JwtAuthGuard extends (0, passport_1.AuthGuard)('jwt') {
    canActivate(context) {
        console.log('[JWT Guard] Checking authentication');
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        console.log('[JWT Guard] Authorization header:', authHeader ? 'Present' : 'Missing');
        if (authHeader) {
            console.log('[JWT Guard] Token preview:', authHeader.substring(0, 20) + '...');
        }
        return super.canActivate(context);
    }
    handleRequest(err, user, info) {
        console.log('[JWT Guard] Handle request - Error:', err?.message || 'None');
        console.log('[JWT Guard] Handle request - User:', user ? 'Found' : 'Not found');
        console.log('[JWT Guard] Handle request - Info:', info?.message || 'None');
        if (err) {
            console.error('[JWT Guard] Authentication error:', err);
            throw err;
        }
        if (!user) {
            console.error('[JWT Guard] No user found, info:', info);
            throw new common_1.UnauthorizedException(info?.message || 'Invalid or expired token');
        }
        console.log('[JWT Guard] Authentication successful for user:', user.userId);
        return user;
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)()
], JwtAuthGuard);
//# sourceMappingURL=jwt-auth.guard.js.map