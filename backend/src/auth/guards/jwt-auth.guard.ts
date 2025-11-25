import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    console.log('[JWT Guard] Checking authentication');
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    console.log('[JWT Guard] Authorization header:', authHeader ? 'Present' : 'Missing');
    if (authHeader) {
      console.log('[JWT Guard] Token preview:', authHeader.substring(0, 20) + '...');
    }
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    console.log('[JWT Guard] Handle request - Error:', err?.message || 'None');
    console.log('[JWT Guard] Handle request - User:', user ? 'Found' : 'Not found');
    console.log('[JWT Guard] Handle request - Info:', info?.message || 'None');
    
    if (err) {
      console.error('[JWT Guard] Authentication error:', err);
      throw err;
    }
    
    if (!user) {
      console.error('[JWT Guard] No user found, info:', info);
      throw new UnauthorizedException(info?.message || 'Invalid or expired token');
    }
    
    console.log('[JWT Guard] Authentication successful for user:', user.userId);
    return user;
  }
}