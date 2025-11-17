import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UpdatePostDto } from './dto/update-post.dto';
import { SearchPostDto } from './dto/search-post.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // API Tạo tin đăng mới
  // Chỉ cho phép vai trò 'owner' (Chủ trọ)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('owner') // Chỉ định vai trò được phép
  @UseGuards(JwtAuthGuard, RolesGuard) // Kích hoạt cả 2 Bảo vệ
  async create(@Body() createPostDto: CreatePostDto, @Request() req: any) {
    // req.user được gán từ JwtAuthGuard
    const user = req.user;

    const newPost = await this.postsService.create(createPostDto, user);

    return {
      message: 'Tạo tin đăng thành công, đang chờ duyệt',
      data: newPost,
    };
  }

  // API lấy danh sách tin đăng
  // GET /posts
  @Get()
  async findAll(@Query() searchPostDto: SearchPostDto) {
    return this.postsService.findAll(searchPostDto);
  }

  // API lấy chi tiết tin đăng theo ID
  // GET /posts/:id
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    // 'id' được ép kiểu sang number nhờ ParseIntPipe
    return this.postsService.findOne(id);
  }

  // API cập nhật tin đăng theo ID
  // PATCH /posts/:id
  @Patch(':id')
  @Roles('owner') // Chỉ định vai trò được phép
  @UseGuards(JwtAuthGuard, RolesGuard) // Kích hoạt cả 2 Bảo vệ
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
    @Request() req: any,
  ) {
    const user = req.user;

    // Kiểm tra và cập nhật tin đăng
    return this.postsService.update(id, updatePostDto, user);
  }

  // API xoá tin đăng theo ID
  // DELETE /posts/:id
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('owner') // Chỉ định vai trò được phép
  @UseGuards(JwtAuthGuard, RolesGuard) // Kích hoạt cả 2 Bảo vệ
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    const user = req.user;

    // Kiểm tra và xoá tin đăng
    return this.postsService.delete(id, user);
  }
}
