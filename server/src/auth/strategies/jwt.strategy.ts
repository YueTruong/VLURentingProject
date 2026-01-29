import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
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
    // 👇 1. Lấy ID user từ bất kỳ trường nào có thể (sub, id, hoặc userId)
    // Để đề phòng trường hợp lúc tạo token em dùng key khác nhau
    const userId = payload.sub || payload.id || payload.userId;

    if (!userId) {
      throw new UnauthorizedException(
        'Token không hợp lệ (không tìm thấy User ID)',
      );
    }

    // 👇 2. Chuẩn hóa Role (chấp nhận cả string hoặc array)
    const normalizedRole =
      typeof payload.role === 'string'
        ? payload.role.toLowerCase()
        : typeof payload.roles === 'string'
          ? payload.roles.toLowerCase()
          : undefined; // Hoặc mặc định là 'student' nếu muốn

    // 👇 3. Trả về object User đầy đủ để gán vào req.user
    // Thầy thêm cả 'id' và 'userId' để Service dùng cái nào cũng trúng
    return {
      id: Number(userId), // Dành cho ai thích dùng user.id
      userId: Number(userId), // Dành cho ai thích dùng user.userId
      email: payload.email,
      username: payload.username,
      role: normalizedRole,
    };
  }
}
