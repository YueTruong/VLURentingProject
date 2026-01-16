import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      // Chỉ định cách lấy Token
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // Không bỏ qua khi token hết hạn (để tự động báo lỗi)
      ignoreExpiration: false,

      // Lấy 'secret key' từ .env
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  // (Được gọi bởi Passport sau khi token đã được xác thực thành công)
  // Hàm này nhận payload đã được giải mã từ token
  // @param payload Payload đã được giải mã (ví dụ: { userId: 1, email: '...' })
  async validate(payload: any) {
    // Bất cứ thứ gì trả về từ đây, Passport sẽ gán nó vào req.user và chỉ cần trả về payload
    const normalizedRole =
      typeof payload.role === 'string'
        ? payload.role.toLowerCase()
        : typeof payload.roles === 'string'
        ? payload.roles.toLowerCase()
        : undefined;

    return {
      userId: payload.sub,
      email: payload.email,
      username: payload.username,
      role: normalizedRole,
    };
  }
}
