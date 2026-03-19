import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
  Query,
  Patch,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserRole } from 'src/auth/dto/register.dto';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'Lay danh gia moi nhat' })
  async findLatest(@Query('limit') limit?: string) {
    const parsed = Number.parseInt(limit ?? '', 10);
    const safeLimit = Number.isFinite(parsed) ? parsed : 3;
    return this.reviewsService.findLatest(safeLimit);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Lay danh gia cua toi' })
  async findMine(@Request() req: any, @Query('limit') limit?: string) {
    const parsedLimit = Number.parseInt(limit ?? '', 10);
    const safeLimit = Number.isFinite(parsedLimit) ? parsedLimit : 20;
    const userId = Number(req?.user?.userId ?? req?.user?.id);
    return this.reviewsService.findByUserId(userId, safeLimit);
  }

  @Get('post/:postId')
  @ApiOperation({ summary: 'Lay danh gia theo bai dang' })
  async findByPost(
    @Param('postId') postId: string,
    @Query('limit') limit?: string,
  ) {
    const parsedPostId = Number.parseInt(postId, 10);
    const parsedLimit = Number.parseInt(limit ?? '', 10);
    const safeLimit = Number.isFinite(parsedLimit) ? parsedLimit : 10;
    return this.reviewsService.findByPostId(parsedPostId, safeLimit);
  }


  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Get('admin')
  @ApiOperation({ summary: 'Admin lay danh sach review de kiem duyet' })
  async findForAdmin(@Query('limit') limit?: string, @Query('q') q?: string) {
    const parsed = Number.parseInt(limit ?? '', 10);
    const safeLimit = Number.isFinite(parsed) ? parsed : 50;
    return this.reviewsService.findForAdmin(safeLimit, q);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Delete('admin/:id')
  @ApiOperation({ summary: 'Admin xoa review vi pham' })
  async deleteForAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.reviewsService.deleteForAdmin(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Cap nhat danh gia' })
  async update(
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @Request() req: any,
  ) {
    const reviewId = Number.parseInt(id, 10);
    return this.reviewsService.update(reviewId, updateReviewDto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Tao danh gia moi' })
  async create(@Body() createReviewDto: CreateReviewDto, @Request() req: any) {
    return this.reviewsService.create(createReviewDto, req.user);
  }
}
