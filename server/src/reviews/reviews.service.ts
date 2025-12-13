import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewEntity } from 'src/database/entities/review.entity';
import { PostEntity } from 'src/database/entities/post.entity';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(ReviewEntity)
    private readonly reviewRepository: Repository<ReviewEntity>,
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
  ) {}

  async create(createReviewDto: CreateReviewDto, user: any) {
    const { postId, rating, comment } = createReviewDto;

    // 1. Kiểm tra bài đăng có tồn tại không
    const post = await this.postRepository.findOneBy({ id: postId });
    if (!post) {
      throw new NotFoundException('Tin đăng không tồn tại');
    }

    // 2. Kiểm tra xem user này đã đánh giá bài này chưa
    const existingReview = await this.reviewRepository.findOne({
      where: {
        userId: user.userId,
        postId: postId,
      },
    });

    if (existingReview) {
      throw new BadRequestException('Bạn đã đánh giá bài đăng này rồi');
    }

    // 3. Tạo đánh giá mới
    const newReview = this.reviewRepository.create({
      rating,
      comment,
      userId: user.userId, // Lấy ID từ token
      post: post,
    });

    return this.reviewRepository.save(newReview);
  }
}
