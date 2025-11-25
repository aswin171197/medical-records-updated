import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'defaultSecretKey',
    });
    console.log('[JWT Strategy] Initialized with secret:', configService.get<string>('JWT_SECRET') ? 'Found' : 'Using default');
  }

  async validate(payload: any) {
    console.log('[JWT Strategy] Validating payload:', payload);
    if (!payload || !payload.sub) {
      console.log('[JWT Strategy] Invalid payload - missing sub');
      throw new UnauthorizedException('Invalid token payload');
    }
    const user = { userId: payload.sub, email: payload.email, id: payload.sub };
    console.log('[JWT Strategy] Validation successful, user:', user);
    return user;
  }
}
