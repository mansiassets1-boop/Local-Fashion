import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../database/database.service';

export interface JwtPayload {
  sub: string;
  phone: string;
  role: string;
  city_id: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private dbService: DatabaseService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'localfashion-secret'),
    });
  }

  async validate(payload: JwtPayload) {
    const result = await this.dbService.query(
      'SELECT id, phone, role, city_id, is_active FROM users WHERE id = $1',
      [payload.sub],
    );
    const user = result.rows[0];
    if (!user || !user.is_active) {
      throw new UnauthorizedException('User not found or deactivated');
    }
    return {
      id: user.id,
      phone: user.phone,
      role: user.role,
      city_id: user.city_id,
    };
  }
}
