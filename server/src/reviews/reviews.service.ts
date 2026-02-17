import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { ReviewEntity } from 'src/database/entities/review.entity';
import { PostEntity } from 'src/database/entities/post.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

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

    return reviews.map((review) => this.serializeReview(review));
  }

  async findByPostId(postId: number, limit = 10) {
    if (!Number.isFinite(postId) || postId <= 0) {
      throw new BadRequestException('postId khong hop le');
    }

    const post = await this.postRepository.findOneBy({ id: postId });
    if (!post) {
      throw new NotFoundException('Tin dang khong ton tai');
    }

    const safeLimit = Number.isFinite(limit)
      ? Math.min(Math.max(Math.floor(limit), 1), 50)
      : 10;

    const summary = await this.reviewRepository
      .createQueryBuilder('review')
      .select('COALESCE(AVG(review.rating), 0)', 'avg')
      .addSelect('COUNT(review.id)', 'count')
      .where('review.post_id = :postId', { postId })
      .getRawOne<{ avg?: string; count?: string }>();

    const reviews = await this.reviewRepository.find({
      where: { postId },
      order: { createdAt: 'DESC' },
      take: safeLimit,
      relations: ['user', 'user.profile'],
    });

    const averageRating = Number(summary?.avg ?? 0);
    const totalReviews = Number(summary?.count ?? 0);

    return {
      postId,
      averageRating: Number.isFinite(averageRating)
        ? Number(averageRating.toFixed(1))
        : 0,
      totalReviews: Number.isFinite(totalReviews) ? totalReviews : 0,
      reviews: reviews.map((review) => this.serializeReview(review)),
    };
  }

  async update(reviewId: number, updateReviewDto: UpdateReviewDto, user: any) {
    if (!Number.isFinite(reviewId) || reviewId <= 0) {
      throw new BadRequestException('reviewId khong hop le');
    }

    const userId = Number(user?.userId ?? user?.id);
    if (!Number.isFinite(userId) || userId <= 0) {
      throw new ForbiddenException('Khong the xac dinh nguoi dung');
    }

    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Danh gia khong ton tai');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('Ban khong co quyen sua danh gia nay');
    }

    const hasRating =
      typeof updateReviewDto.rating === 'number' &&
      Number.isFinite(updateReviewDto.rating);
    const hasComment =
      typeof updateReviewDto.comment === 'string' &&
      updateReviewDto.comment.trim() !== '';

    if (!hasRating && !hasComment) {
      throw new BadRequestException('Vui long nhap so sao hoac noi dung');
    }

    if (hasRating) {
      review.rating = updateReviewDto.rating as number;
    }

    if (typeof updateReviewDto.comment === 'string') {
      const trimmed = updateReviewDto.comment.trim();
      if (!trimmed) {
        throw new BadRequestException('Vui long nhap noi dung danh gia');
      }
      review.comment = trimmed;
    }

    const saved = await this.reviewRepository.save(review);
    return this.serializeReview(saved);
  }

  async findByUserId(userId: number, limit = 20) {
    if (!Number.isFinite(userId) || userId <= 0) {
      throw new BadRequestException('userId khong hop le');
    }

    const safeLimit = Number.isFinite(limit)
      ? Math.min(Math.max(Math.floor(limit), 1), 50)
      : 20;

    const reviews = await this.reviewRepository.find({
      where: { userId, postId: Not(IsNull()) },
      order: { createdAt: 'DESC' },
      take: safeLimit,
      relations: ['post', 'post.category'],
    });

    return reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment ?? '',
      createdAt: review.createdAt,
      post: review.post
        ? {
            id: review.post.id,
            title: review.post.title,
            address: review.post.address,
            status: review.post.status,
            category: review.post.category
              ? {
                  id: review.post.category.id,
                  name: review.post.category.name,
                }
              : undefined,
          }
        : undefined,
    }));
  }

  private serializeReview(review: ReviewEntity) {
    return {
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
    };
  }
}
