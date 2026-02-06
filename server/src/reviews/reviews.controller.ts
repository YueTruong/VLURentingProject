import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
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
  @Post()
  @ApiOperation({ summary: 'Tao danh gia moi' })
  async create(@Body() createReviewDto: CreateReviewDto, @Request() req: any) {
    return this.reviewsService.create(createReviewDto, req.user);
  }
}
