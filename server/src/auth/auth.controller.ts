import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth') // Tiền tố chung cho tất cả API trong file này là /auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // API Endpoint cho chức năng Đăng ký
  // POST /auth/register
  @Post('register')
  @HttpCode(HttpStatus.CREATED) // Trả về mã 201 Created khi thành công
  async register(@Body() registerDto: RegisterDto) {
    // Nhờ ValidationPipe ở main.ts, registerDto sẽ tự động được kiểm tra
    // Nếu sai (ví dụ: email không hợp lệ), NestJS sẽ tự động trả về lỗi 400

    const user = await this.authService.register(registerDto);

    return {
      message: 'Đăng ký tài khoản thành công',
      data: user,
    };
  }

  // API Endpoint cho chức năng Đăng nhập
  // POST /auth/login
  @Post('login')
  @UseGuards(JwtAuthGuard)
  // @UseGuards(AuthGuard('local'))
  @HttpCode(HttpStatus.OK) // Trả về mã 200 OK khi thành công
  async login(@Request() req: any, @Body() loginDto: LoginDto) {
    // Nếu đến được đây, tức là LocalAuthGuard đã xác thực thành công
    // req.user sẽ chứa thông tin user do LocalStrategy trả về

    return this.authService.login(req.user);
  }

  // API Endpoint để lấy thông tin user hiện tại
  // GET /auth/profile
  @UseGuards(JwtAuthGuard) // Kích hoạt JwtAuthGuard cho route này
  @Get('profile')
  async getProfile(@Request() req: any) {
    // Nếu đến được đây, tức là JwtAuthGuard đã xác thực thành công
    // req.user sẽ chứa thông tin user do JwtStrategy trả về
    const userId = req.user.userId;

    // Gọi service để lấy thông tin chi tiết của user
    return this.authService.getProfile(userId);
  }
}
