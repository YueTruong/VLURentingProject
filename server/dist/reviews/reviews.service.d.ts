import { Repository } from 'typeorm';
import { ReviewEntity } from 'src/database/entities/review.entity';
import { PostEntity } from 'src/database/entities/post.entity';
import { CreateReviewDto } from './dto/create-review.dto';
export declare class ReviewsService {
    private readonly reviewRepository;
    private readonly postRepository;
    constructor(reviewRepository: Repository<ReviewEntity>, postRepository: Repository<PostEntity>);
    create(createReviewDto: CreateReviewDto, user: any): Promise<ReviewEntity>;
}
