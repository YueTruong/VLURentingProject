import {
  Controller,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Get,
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UpdatePostStatusDto } from './dto/update-post-status.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Admin Management')
@ApiBearerAuth()
@Controller('admin') // Tiền tố chung /admin
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // API lấy tất cả bài đăng
  // Có thể lọc theo trạng thái bằng query param ?status=
  // GET /admin/posts
  @Get('/posts')
  @Roles('admin') // Chỉ cho phép role 'admin'
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy tất cả bài đăng với tùy chọn lọc theo trạng thái' })
  async getAllPosts(@Query('status') status: string) {
    // Dùng @Query để lấy tham số truy vấn 'status'
    return this.adminService.getAllPosts(status);
  }

  // API cập nhật trạng thái tin đăng
  // PATCH /admin/posts/:id/status
  @Patch('/posts/:id/status')
  @HttpCode(HttpStatus.OK)
  @Roles('admin') // CChỉ cho phép role 'admin'
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật trạng thái của một bài đăng' })
  async updatePostStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostStatusDto: UpdatePostStatusDto,
  ) {
    const updatedPost = await this.adminService.updatePostStatus(
      id,
      updatePostStatusDto,
    );
    return {
      message: 'Cập nhật trạng thái tin đăng thành công',
      data: updatedPost,
    };
  }

  // API cho phép Admin xem tất cả người dùng
  // GET /admin/users
  @Get('/users')
  @Roles('admin') // Chỉ cho phép role 'admin'
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy tất cả người dùng' })
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  // API cho phép Admin mở/khoá người dùng
  // PATCH /admin/users/:id/status
  @Patch('/users/:id/status')
  @Roles('admin') // Chỉ cho phép role 'admin'
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật trạng thái của một người dùng' })
  async updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() UpdateUserStatusDto: UpdateUserStatusDto,
  ) {
    const updatedUser = await this.adminService.updateUserStatus(
      id,
      UpdateUserStatusDto,
    );
    return {
      message: 'Cập nhật trạng thái người dùng thành công',
      data: updatedUser,
    };
  }
}
