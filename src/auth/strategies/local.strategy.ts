import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    // Cấu hình cho "người gác cổng"
    super({
      usernameField: 'email', // Báo cho Passport biết chúng ta dùng 'email' thay vì 'username'
      passwordField: 'password',
    });
  }

  // Đây là hàm "kiểm tra" cốt lõi.
  // Passport sẽ tự động gọi hàm này khi LocalAuthGuard được kích hoạt.
  // @param email Email do người dùng cung cấp
  // @param password Password do người dùng cung cấp
  async validate(email: string, password: string): Promise<any> {
    // Gọi hàm validateUser (chúng ta sẽ tạo ở bước 7.2)
    const user = await this.authService.validateUser(email, password);

    if (!user) {
      // Nếu user không tồn tại (email sai) hoặc pass sai, ném lỗi 401
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    // Nếu đúng, trả về user. Passport sẽ tự động gán user này vào req.user
    return user;
  }
}
