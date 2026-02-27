import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';

type AuthenticatedRequest = Request & {
  user?: {
    userId?: number;
  };
};

@ApiTags('Me - Security')
@ApiBearerAuth()
@Controller('me')
export class MeController {
  constructor(private readonly authService: AuthService) {}

  @Get('security')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy thông tin đăng nhập và bảo mật của người dùng hiện tại' })
  async getSecurity(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.userId;
    return this.authService.getSecurityOverview(userId, req);
  }
}

