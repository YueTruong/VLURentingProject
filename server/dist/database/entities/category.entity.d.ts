import { PostEntity } from './post.entity';
export declare class CategoryEntity {
    id: number;
    name: string;
    description: string;
    posts: PostEntity[];
}
