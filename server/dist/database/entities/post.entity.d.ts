import { UserEntity } from './user.entity';
import { CategoryEntity } from './category.entity';
import { AmenityEntity } from './amenity.entity';
import { PostImageEntity } from './post-image.entity';
import { ReviewEntity } from './review.entity';
type PostStatus = 'pending' | 'approved' | 'rejected' | 'rented' | 'hidden';
export declare class PostEntity {
    id: number;
    title: string;
    description: string;
    price: number;
    area: number;
    address: string;
    latitude: number;
    longitude: number;
    max_occupancy: number;
    status: PostStatus;
    createdAt: Date;
    updatedAt: Date;
    userId: number;
    categoryId: number;
    user: UserEntity;
    category: CategoryEntity;
    images: PostImageEntity[];
    amenities: AmenityEntity[];
    reviews: ReviewEntity[];
}
export {};
