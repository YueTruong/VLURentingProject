import {
  Controller,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  async getMine(@Request() req: any) {
    return this.service.findMyNotifications(req.user.userId || req.user.id);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    return this.service.countUnread(req.user.userId || req.user.id);
  }

  @Patch('read-all')
  async readAll(@Request() req: any) {
    return this.service.markAllAsRead(req.user.userId || req.user.id);
  }

  @Patch(':id/read')
  async readOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.service.markAsRead(id, req.user.userId || req.user.id);
  }
}
