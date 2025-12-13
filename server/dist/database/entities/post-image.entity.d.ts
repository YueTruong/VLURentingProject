import { PostEntity } from './post.entity';
export declare class PostImageEntity {
    id: number;
    postId: number;
    image_url: string;
    is_video: boolean;
    post: PostEntity;
}
