import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
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

    let post: PostEntity | null = null;

    if (typeof postId === 'number' && Number.isFinite(postId)) {
      // 1. Kiểm tra bài đăng có tồn tại không
      post = await this.postRepository.findOneBy({ id: postId });
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
    } else if (typeof postId !== 'undefined') {
      throw new BadRequestException('postId không hợp lệ');
    }

    // 3. Tạo đánh giá mới
    const newReview = this.reviewRepository.create({
      rating,
      comment,
      userId: user.userId, // Lấy ID từ token
      post,
      postId: post ? post.id : null,
    });

    return this.reviewRepository.save(newReview);
  }

  async findLatest(limit = 3) {
    const safeLimit = Number.isFinite(limit)
      ? Math.min(Math.max(Math.floor(limit), 1), 12)
      : 3;

    const reviews = await this.reviewRepository.find({
      where: { postId: IsNull() },
      order: { createdAt: 'DESC' },
      take: safeLimit,
      relations: ['user', 'user.profile'],
    });

    return reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment ?? '',
      createdAt: review.createdAt,
      user: review.user
        ? {
            id: review.user.id,
            username: review.user.username,
            email: review.user.email,
            profile: review.user.profile
              ? {
                  full_name: review.user.profile.full_name,
                  avatar_url: review.user.profile.avatar_url,
                }
              : undefined,
          }
        : undefined,
    }));
  }
}
