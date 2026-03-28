import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { DatabaseService } from '../database/database.service';
import { UsersService } from '../users/users.service';
import { SendOtpDto, VerifyOtpDto, RefreshTokenDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ─── OTP ──────────────────────────────────────────────────────────────────

  async sendOtp(dto: SendOtpDto): Promise<{ message: string }> {
    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Invalidate previous unused OTPs for this phone
    await this.db.query(
      `UPDATE otp_records SET is_used = true
       WHERE phone = $1 AND is_used = false AND expires_at > NOW()`,
      [dto.phone],
    );

    // Store new OTP
    await this.db.query(
      `INSERT INTO otp_records (phone, otp, expires_at)
       VALUES ($1, $2, $3)`,
      [dto.phone, otp, expiresAt],
    );

    // Send SMS via MSG91
    await this.sendSmsOtp(dto.phone, otp);

    this.logger.log(`OTP sent to ${dto.phone}`);
    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<{ access_token: string; refresh_token: string; user: any }> {
    // Find latest valid OTP record
    const result = await this.db.query(
      `SELECT id, otp, expires_at, attempts, is_used
       FROM otp_records
       WHERE phone = $1 AND is_used = false
       ORDER BY created_at DESC
       LIMIT 1`,
      [dto.phone],
    );

    const record = result.rows[0];
    if (!record) {
      throw new BadRequestException('No active OTP found. Please request a new OTP.');
    }

    // Check expiry
    if (new Date(record.expires_at) < new Date()) {
      throw new BadRequestException('OTP has expired. Please request a new OTP.');
    }

    // Check max attempts
    if (record.attempts >= 3) {
      throw new BadRequestException('Maximum OTP attempts exceeded. Please request a new OTP.');
    }

    // Increment attempts
    await this.db.query(
      'UPDATE otp_records SET attempts = attempts + 1 WHERE id = $1',
      [record.id],
    );

    // Validate OTP
    if (record.otp !== dto.otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Mark as used
    await this.db.query(
      'UPDATE otp_records SET is_used = true WHERE id = $1',
      [record.id],
    );

    // Get or create user
    const user = await this.usersService.getOrCreate(dto.phone, {
      role: dto.role || 'buyer',
      city_id: dto.city_id,
      fcm_token: dto.fcm_token,
    });

    const tokens = this.generateTokens(user);
    return { ...tokens, user: this.sanitizeUser(user) };
  }

  async refreshToken(dto: RefreshTokenDto): Promise<{ access_token: string }> {
    try {
      const payload = this.jwtService.verify(dto.refresh_token, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET', 'localfashion-refresh-secret'),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.is_active) {
        throw new UnauthorizedException('User not found');
      }

      const access_token = this.jwtService.sign(
        { sub: user.id, phone: user.phone, role: user.role, city_id: user.city_id },
        { expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '7d') },
      );

      return { access_token };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, fcmToken?: string): Promise<{ message: string }> {
    if (fcmToken) {
      await this.db.query(
        'UPDATE users SET fcm_token = NULL WHERE id = $1 AND fcm_token = $2',
        [userId, fcmToken],
      );
    }
    return { message: 'Logged out successfully' };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateTokens(user: any) {
    const payload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
      city_id: user.city_id,
    };

    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET', 'localfashion-refresh-secret'),
      expiresIn: '30d',
    });

    return { access_token, refresh_token };
  }

  private sanitizeUser(user: any) {
    const { fcm_token, ...safe } = user;
    return safe;
  }

  private async sendSmsOtp(phone: string, otp: string): Promise<void> {
    const apiKey = this.config.get<string>('MSG91_API_KEY');
    const templateId = this.config.get<string>('MSG91_TEMPLATE_ID');
    const senderId = this.config.get<string>('MSG91_SENDER_ID', 'LCLFSN');

    if (!apiKey) {
      // Dev mode: log OTP
      this.logger.warn(`[DEV MODE] OTP for ${phone}: ${otp}`);
      return;
    }

    try {
      // MSG91 API v5
      await axios.post(
        'https://control.msg91.com/api/v5/flow/',
        {
          template_id: templateId,
          short_url: '0',
          recipients: [
            {
              mobiles: phone.replace('+', ''),
              otp,
            },
          ],
        },
        {
          headers: {
            authkey: apiKey,
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phone}:`, error.message);
      // Don't throw — OTP is stored; user can retry
    }
  }
}
