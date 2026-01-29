import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { SearchPostDto } from './dto/search-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
// 👇 Em kiểm tra lại đường dẫn import này cho đúng với dự án của em
import { UserRole } from '../auth/dto/register.dto';

@ApiTags('Posts - Quản lý Tin đăng')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // ==================================================================
  // 🟢 NHÓM 1: CÁC ROUTE CỦA ADMIN & STATIC (ƯU TIÊN CAO NHẤT)
  // ==================================================================

  @Get('admin') // 👈 QUAN TRỌNG: Route này phải nằm trên cùng
  @ApiOperation({ summary: 'Lấy danh sách tin cho Admin (Xem được tất cả)' })
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getAdminPosts(@Query('status') status?: string) {
    return this.postsService.findAllForAdmin(status);
  }

  @Get('me') // 👈 Route 'me' cũng phải nằm trên ':id'
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách tin của chính mình (Chủ trọ)' })
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findMine(@Req() req: any) {
    return this.postsService.findMine(req.user);
  }

  // API Duyệt tin (Admin) - Đặt đường dẫn rõ ràng để tránh nhầm lẫn
  @Patch('admin/:id/approve')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Duyệt/Từ chối tin đăng' })
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async approvePost(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
    @Body('rejectionReason') rejectionReason?: string,
  ) {
    return this.postsService.approve(id, status, rejectionReason);
  }

  // ==================================================================
  // 🟡 NHÓM 2: CÁC ROUTE CHỨC NĂNG CƠ BẢN
  // ==================================================================

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo tin đăng mới' })
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.LANDLORD)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(@Body() createPostDto: CreatePostDto, @Req() req: any) {
    return this.postsService.create(createPostDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tin đăng (Public Search)' })
  async findAll(@Query() searchPostDto: SearchPostDto) {
    return this.postsService.findAll(searchPostDto);
  }

  // ==================================================================
  // 🔴 NHÓM 3: CÁC ROUTE CÓ PARAM ID (ĐỘNG) - PHẢI ĐỂ DƯỚI CÙNG
  // ==================================================================

  @Get(':id') // 👈 Route này "ăn tạp" nhất, phải cho xuống đáy
  @ApiOperation({ summary: 'Lấy chi tiết tin đăng theo ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật tin đăng (Chủ trọ)' })
  @Roles(UserRole.LANDLORD)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
    @Req() req: any,
  ) {
    return this.postsService.update(id, updatePostDto, req.user);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xoá tin đăng' })
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async delete(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.postsService.delete(id, req.user);
  }
}
