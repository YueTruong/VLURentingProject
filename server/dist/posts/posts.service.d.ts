import { Repository } from 'typeorm';
import { PostEntity } from 'src/database/entities/post.entity';
import { CategoryEntity } from 'src/database/entities/category.entity';
import { AmenityEntity } from 'src/database/entities/amenity.entity';
import { PostImageEntity } from 'src/database/entities/post-image.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UserEntity } from 'src/database/entities/user.entity';
import { UpdatePostDto } from './dto/update-post.dto';
import { SearchPostDto } from './dto/search-post.dto';
export declare class PostsService {
    private readonly postRepository;
    private readonly categoryRepository;
    private readonly amenityRepository;
    constructor(postRepository: Repository<PostEntity>, categoryRepository: Repository<CategoryEntity>, amenityRepository: Repository<AmenityEntity>);
    create(createPostDto: CreatePostDto, user: any): Promise<PostEntity>;
    findAll(searchPostDto: SearchPostDto): Promise<PostEntity[]>;
    findOne(id: number): Promise<{
        averageRating: number;
        reviewCount: number;
        id: number;
        title: string;
        description: string;
        price: number;
        area: number;
        address: string;
        latitude: number;
        longitude: number;
        max_occupancy: number;
        status: "pending" | "approved" | "rejected" | "rented" | "hidden";
        createdAt: Date;
        updatedAt: Date;
        userId: number;
        categoryId: number;
        user: UserEntity;
        category: CategoryEntity;
        images: PostImageEntity[];
        amenities: AmenityEntity[];
        reviews: import("../database/entities/review.entity").ReviewEntity[];
    }>;
    update(id: number, updatePostDto: UpdatePostDto, user: any): Promise<PostEntity>;
    delete(id: number, user: any): Promise<{
        message: string;
    }>;
}
