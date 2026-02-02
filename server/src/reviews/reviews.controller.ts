import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
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
  @ApiOperation({ summary: 'Lấy đánh giá mới nhất' })
  async findLatest(@Query('limit') limit?: string) {
    const parsed = Number.parseInt(limit ?? '', 10);
    const safeLimit = Number.isFinite(parsed) ? parsed : 3;
    return this.reviewsService.findLatest(safeLimit);
  }

  @UseGuards(JwtAuthGuard) // Phải đăng nhập mới được đánh giá
  @Post()
  @ApiOperation({ summary: 'Tạo đánh giá mới' })
  async create(@Body() createReviewDto: CreateReviewDto, @Request() req: any) {
    return this.reviewsService.create(createReviewDto, req.user);
  }
}
