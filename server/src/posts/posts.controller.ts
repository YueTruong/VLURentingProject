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
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../auth/dto/register.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { SearchPostDto } from './dto/search-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsService } from './posts.service';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get('admin')
  @ApiOperation({ summary: 'Get posts for admin' })
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getAdminPosts(@Query('status') status?: string) {
    return this.postsService.findAllForAdmin(status);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my posts' })
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findMine(@Req() req: any) {
    return this.postsService.findMine(req.user);
  }

  @Get('saved/ids')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my saved post ids' })
  @Roles(UserRole.STUDENT, UserRole.LANDLORD, UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getMySavedPostIds(@Req() req: any) {
    return this.postsService.getMySavedPostIds(req.user);
  }

  @Patch('admin/:id/approve')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve/reject/hide post' })
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async approvePost(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
    @Body('rejectionReason') rejectionReason?: string,
  ) {
    return this.postsService.approve(id, status, rejectionReason);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create post' })
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.LANDLORD)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(@Body() createPostDto: CreatePostDto, @Req() req: any) {
    return this.postsService.create(createPostDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get public approved posts' })
  async findAll(@Query() searchPostDto: SearchPostDto) {
    return this.postsService.findAll(searchPostDto);
  }

  @Post(':id/save')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save post to favorites' })
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.STUDENT, UserRole.LANDLORD, UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async savePost(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.postsService.savePost(id, req.user);
  }

  @Delete(':id/save')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove post from favorites' })
  @Roles(UserRole.STUDENT, UserRole.LANDLORD, UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async unsavePost(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.postsService.unsavePost(id, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get post by id' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update post' })
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
  @ApiOperation({ summary: 'Delete post' })
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async delete(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.postsService.delete(id, req.user);
  }
}
