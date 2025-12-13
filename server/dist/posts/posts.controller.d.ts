import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { SearchPostDto } from './dto/search-post.dto';
export declare class PostsController {
    private readonly postsService;
    constructor(postsService: PostsService);
    create(createPostDto: CreatePostDto, req: any): Promise<{
        message: string;
        data: import("../database/entities/post.entity").PostEntity;
    }>;
    findAll(searchPostDto: SearchPostDto): Promise<import("../database/entities/post.entity").PostEntity[]>;
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
        user: import("../database/entities/user.entity").UserEntity;
        category: import("../database/entities/category.entity").CategoryEntity;
        images: import("../database/entities/post-image.entity").PostImageEntity[];
        amenities: import("../database/entities/amenity.entity").AmenityEntity[];
        reviews: import("../database/entities/review.entity").ReviewEntity[];
    }>;
    update(id: number, updatePostDto: UpdatePostDto, req: any): Promise<import("../database/entities/post.entity").PostEntity>;
    delete(id: number, req: any): Promise<{
        message: string;
    }>;
}
