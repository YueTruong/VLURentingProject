import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
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
import { UpdateSettingsPersonalDto } from './dto/update-settings-personal.dto';
import { UpdateSettingsPreferencesDto } from './dto/update-settings-preferences.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

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
  @ApiOperation({ summary: 'Register a new account' })
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(registerDto);
    return {
      message: 'Register successfully',
      data: user,
    };
  }

  @Post('login')
  @UseGuards(AuthGuard('local'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login by email/username and password' })
  async login(@Req() req: any, @Body() _loginDto: LoginDto) {
    return this.authService.login(req.user);
  }

  @Post('oauth-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'OAuth login from NextAuth bridge' })
  async oauthLogin(
    @Body() dto: OauthLoginDto,
    @Headers('x-oauth-bridge-secret') bridgeSecret?: string,
  ) {
    return this.authService.oauthLogin(dto, bridgeSecret);
  }

  @Post('link/:provider')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link OAuth provider to current account' })
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
  @ApiOperation({ summary: 'Get current account profile' })
  async getProfile(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.userId;
    return this.authService.getProfile(userId);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current account profile' })
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    const userId = req.user?.userId;
    return this.authService.updateProfile(userId, dto);
  }

  @Get('public-profile/:userId')
  @ApiOperation({ summary: 'Get public profile by user id' })
  async getPublicProfile(@Param('userId', ParseIntPipe) userId: number) {
    return this.authService.getPublicProfile(userId);
  }

  @Get('settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get settings (compat route)' })
  async getSettings(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.userId;
    return this.authService.getSettings(userId);
  }

  @Patch('settings/personal')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update personal settings (compat route)' })
  async updateSettingsPersonal(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateSettingsPersonalDto,
  ) {
    const userId = req.user?.userId;
    return this.authService.updateSettingsPersonal(userId, dto);
  }

  @Patch('settings/preferences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update preferences settings (compat route)' })
  async updateSettingsPreferences(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateSettingsPreferencesDto,
  ) {
    const userId = req.user?.userId;
    return this.authService.updateSettingsPreferences(userId, dto);
  }

  @Patch('settings/password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password from settings (compat route)' })
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
  ) {
    const userId = req.user?.userId;
    return this.authService.changePassword(userId, dto);
  }
}
