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
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

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
