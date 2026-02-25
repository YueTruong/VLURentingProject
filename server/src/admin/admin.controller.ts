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
  Post,
  Delete,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UpdatePostStatusDto } from './dto/update-post-status.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ManageCategoryDto } from './dto/manage-category.dto';
import { ManageAmenityDto } from './dto/manage-amenity.dto';

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
  @ApiOperation({
    summary: 'Lấy tất cả bài đăng với tùy chọn lọc theo trạng thái',
  })
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



  @Get('/categories')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Lấy danh sách danh mục' })
  async getAllCategories() {
    return this.adminService.getAllCategories();
  }

  @Post('/categories')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Tạo danh mục mới' })
  async createCategory(@Body() payload: ManageCategoryDto) {
    return this.adminService.createCategory(payload);
  }

  @Patch('/categories/:id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Cập nhật danh mục' })
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: ManageCategoryDto,
  ) {
    return this.adminService.updateCategory(id, payload);
  }

  @Delete('/categories/:id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Xóa danh mục' })
  async deleteCategory(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteCategory(id);
  }

  @Get('/amenities')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Lấy danh sách tiện ích' })
  async getAllAmenities() {
    return this.adminService.getAllAmenities();
  }

  @Post('/amenities')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Tạo tiện ích mới' })
  async createAmenity(@Body() payload: ManageAmenityDto) {
    return this.adminService.createAmenity(payload);
  }

  @Patch('/amenities/:id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Cập nhật tiện ích' })
  async updateAmenity(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: ManageAmenityDto,
  ) {
    return this.adminService.updateAmenity(id, payload);
  }

  @Delete('/amenities/:id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Xóa tiện ích' })
  async deleteAmenity(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteAmenity(id);
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
