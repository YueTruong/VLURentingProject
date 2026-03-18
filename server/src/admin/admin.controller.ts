import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AdminService } from './admin.service';
import { ManageAmenityDto } from './dto/manage-amenity.dto';
import { ManageCategoryDto } from './dto/manage-category.dto';
import { ReviewIdentityVerificationDto } from './dto/review-identity-verification.dto';
import { UpdatePostStatusDto } from './dto/update-post-status.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@ApiTags('Admin Management')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('/posts')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Lay tat ca bai dang voi tuy chon loc theo trang thai',
  })
  async getAllPosts(@Query('status') status?: string) {
    return this.adminService.getAllPosts(status);
  }

  @Patch('/posts/:id/status')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Cap nhat trang thai cua mot bai dang' })
  async updatePostStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostStatusDto: UpdatePostStatusDto,
  ) {
    const updatedPost = await this.adminService.updatePostStatus(
      id,
      updatePostStatusDto,
    );
    return {
      message: 'Cap nhat trang thai tin dang thanh cong',
      data: updatedPost,
    };
  }

  @Get('/users')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Lay tat ca nguoi dung' })
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('/identity-verifications')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Lay danh sach ho so xac minh danh tinh' })
  async getIdentityVerifications(@Query('status') status?: string) {
    return this.adminService.getIdentityVerifications(status);
  }

  @Get('/identity-verifications/file')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Lay tep xac minh danh tinh de admin xem truoc' })
  async getIdentityVerificationDocument(
    @Query('reference') reference: string,
    @Res() res: Response,
  ) {
    const filePath =
      await this.adminService.getIdentityVerificationDocumentPath(reference);
    return res.sendFile(filePath);
  }

  @Patch('/users/:id/identity-verification')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Duyet ho so xac minh danh tinh cua nguoi dung' })
  async reviewIdentityVerification(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: ReviewIdentityVerificationDto,
  ) {
    return this.adminService.reviewIdentityVerification(id, payload);
  }

  @Get('/categories')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Lay danh sach danh muc' })
  async getAllCategories() {
    return this.adminService.getAllCategories();
  }

  @Post('/categories')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Tao danh muc moi' })
  async createCategory(@Body() payload: ManageCategoryDto) {
    return this.adminService.createCategory(payload);
  }

  @Patch('/categories/:id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Cap nhat danh muc' })
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: ManageCategoryDto,
  ) {
    return this.adminService.updateCategory(id, payload);
  }

  @Delete('/categories/:id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Xoa danh muc' })
  async deleteCategory(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteCategory(id);
  }

  @Get('/amenities')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Lay danh sach tien ich' })
  async getAllAmenities() {
    return this.adminService.getAllAmenities();
  }

  @Post('/amenities')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Tao tien ich moi' })
  async createAmenity(@Body() payload: ManageAmenityDto) {
    return this.adminService.createAmenity(payload);
  }

  @Patch('/amenities/:id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Cap nhat tien ich' })
  async updateAmenity(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: ManageAmenityDto,
  ) {
    return this.adminService.updateAmenity(id, payload);
  }

  @Delete('/amenities/:id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Xoa tien ich' })
  async deleteAmenity(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteAmenity(id);
  }

  @Patch('/users/:id/status')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Cap nhat trang thai cua mot nguoi dung' })
  async updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
  ) {
    const updatedUser = await this.adminService.updateUserStatus(
      id,
      updateUserStatusDto,
    );
    return {
      message: 'Cap nhat trang thai nguoi dung thanh cong',
      data: updatedUser,
    };
  }
}
