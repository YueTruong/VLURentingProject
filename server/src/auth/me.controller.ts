import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { UpdateSettingsPersonalDto } from './dto/update-settings-personal.dto';
import { UpdateSettingsPreferencesDto } from './dto/update-settings-preferences.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SubmitIdentityVerificationDto } from './dto/submit-identity-verification.dto';

type AuthenticatedRequest = Request & {
  user?: {
    userId?: number;
  };
};

@ApiTags('Me')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me')
export class MeController {
  constructor(private readonly authService: AuthService) {}

  @Get('security')
  @ApiOperation({ summary: 'Get login and account security overview' })
  async getSecurity(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.userId;
    return this.authService.getSecurityOverview(userId, req);
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get current user settings' })
  async getSettings(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.userId;
    return this.authService.getSettings(userId);
  }

  @Patch('settings/personal')
  @ApiOperation({ summary: 'Update personal information in settings' })
  async updatePersonal(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateSettingsPersonalDto,
  ) {
    const userId = req.user?.userId;
    return this.authService.updateSettingsPersonal(userId, dto);
  }

  @Patch('settings/preferences')
  @ApiOperation({ summary: 'Update privacy/notification/language preferences' })
  async updatePreferences(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateSettingsPreferencesDto,
  ) {
    const userId = req.user?.userId;
    return this.authService.updateSettingsPreferences(userId, dto);
  }

  @Patch('settings/password')
  @ApiOperation({ summary: 'Change or set password from settings' })
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
  ) {
    const userId = req.user?.userId;
    return this.authService.changePassword(userId, dto);
  }

  @Get('verification')
  @ApiOperation({ summary: 'Get current identity verification status' })
  async getIdentityVerification(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.userId;
    return this.authService.getIdentityVerification(userId);
  }

  @Patch('verification')
  @ApiOperation({ summary: 'Submit or update identity verification data' })
  async submitIdentityVerification(
    @Req() req: AuthenticatedRequest,
    @Body() dto: SubmitIdentityVerificationDto,
  ) {
    const userId = req.user?.userId;
    return this.authService.submitIdentityVerification(userId, dto);
  }
}
