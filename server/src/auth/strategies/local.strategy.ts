import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      // XÓA dòng usernameField: 'email' đi.
      // Mặc định nó sẽ tìm field tên là 'username' trong body gửi lên.
    });
  }

  async validate(username: string, pass: string): Promise<any> {
    // Biến 'username' ở đây chính là cái identifier (email hoặc username)
    const user = await this.authService.validateUser(username, pass);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
