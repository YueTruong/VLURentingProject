import { UserEntity } from './user.entity';
import { PostEntity } from './post.entity';
export declare class ReviewEntity {
    id: number;
    rating: number;
    comment: string;
    createdAt: Date;
    userId: number;
    postId: number;
    user: UserEntity;
    post: PostEntity;
}
