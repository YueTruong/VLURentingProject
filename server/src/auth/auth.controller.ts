import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OauthLoginDto } from './dto/oauth-login.dto';
import { LinkProviderDto } from './dto/link-provider.dto';

type AuthenticatedRequest = Request & {
  user?: {
    userId?: number;
  };
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(registerDto);
    return {
      message: 'Đăng ký tài khoản thành công',
      data: user,
    };
  }

  @Post('login')
  @UseGuards(AuthGuard('local'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập bằng email/username và mật khẩu' })
  async login(@Req() req: any, @Body() _loginDto: LoginDto) {
    return this.authService.login(req.user);
  }

  @Post('oauth-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập OAuth từ NextAuth bridge' })
  async oauthLogin(
    @Body() dto: OauthLoginDto,
    @Headers('x-oauth-bridge-secret') bridgeSecret?: string,
  ) {
    return this.authService.oauthLogin(dto, bridgeSecret);
  }

  @Post('link/:provider')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Liên kết provider OAuth vào tài khoản hiện tại' })
  async linkProvider(
    @Req() req: AuthenticatedRequest,
    @Param('provider') provider: string,
    @Body() dto: LinkProviderDto,
  ) {
    const userId = req.user?.userId;
    return this.authService.linkProvider(userId, provider, dto);
  }

  @Delete('link/:provider')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Ngắt liên kết provider OAuth khỏi tài khoản hiện tại',
  })
  async unlinkProvider(
    @Req() req: AuthenticatedRequest,
    @Param('provider') provider: string,
  ) {
    const userId = req.user?.userId;
    return this.authService.unlinkProvider(userId, provider);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin tài khoản hiện tại' })
  async getProfile(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.userId;
    return this.authService.getProfile(userId);
  }
}
