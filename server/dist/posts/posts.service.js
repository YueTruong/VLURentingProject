"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const post_entity_1 = require("../database/entities/post.entity");
const category_entity_1 = require("../database/entities/category.entity");
const amenity_entity_1 = require("../database/entities/amenity.entity");
const post_image_entity_1 = require("../database/entities/post-image.entity");
let PostsService = class PostsService {
    postRepository;
    categoryRepository;
    amenityRepository;
    constructor(postRepository, categoryRepository, amenityRepository) {
        this.postRepository = postRepository;
        this.categoryRepository = categoryRepository;
        this.amenityRepository = amenityRepository;
    }
    async create(createPostDto, user) {
        const { categoryId, amenityIds, imageUrls, ...postData } = createPostDto;
        const category = await this.categoryRepository.findOne({
            where: { id: categoryId },
        });
        if (!category) {
            throw new common_1.NotFoundException('Không tìm thấy loại phòng (Category)');
        }
        let amenities = [];
        if (amenityIds && amenityIds.length > 0) {
            amenities = await this.amenityRepository.findBy({
                id: (0, typeorm_2.In)(amenityIds),
            });
        }
        let images = [];
        if (imageUrls && imageUrls.length > 0) {
            images = imageUrls.map((url) => {
                const img = new post_image_entity_1.PostImageEntity();
                img.image_url = url;
                return img;
            });
        }
        const newPost = this.postRepository.create({
            ...postData,
            category: category,
            amenities: amenities,
            images: images,
            userId: user.userId,
            status: 'pending',
        });
        return this.postRepository.save(newPost);
    }
    async findAll(searchPostDto) {
        const { keyword, price_min, price_max, area_min, area_max, category_id, amenity_ids, lat, lng, radius, } = searchPostDto;
        const queryBuilder = this.postRepository.createQueryBuilder('post');
        queryBuilder.where('post.status = :status', { status: 'approved' });
        queryBuilder
            .leftJoinAndSelect('post.category', 'category')
            .leftJoinAndSelect('post.images', 'images');
        if (keyword) {
            queryBuilder.andWhere('(post.title LIKE :keyword OR post.address LIKE :keyword)', { keyword: `%${keyword}%` });
        }
        if (price_min) {
            queryBuilder.andWhere('post.price >= :price_min', { price_min });
        }
        if (price_max) {
            queryBuilder.andWhere('post.price <= :price_max', { price_max });
        }
        if (lat && lng && radius) {
            const haversineFormula = `(6371 * acos(cos(radians(:lat)) * cos(radians(post.latitude)) * cos(radians(post.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(post.latitude))))`;
            queryBuilder.andWhere(`${haversineFormula} <= :radius`, {
                lat,
                lng,
                radius,
            });
            queryBuilder.orderBy('post.createdAt', 'DESC');
        }
        if (area_min) {
            queryBuilder.andWhere('post.area >= :area_min', { area_min });
        }
        if (area_max) {
            queryBuilder.andWhere('post.area <= :area_max', { area_max });
        }
        if (category_id) {
            queryBuilder.andWhere('post.categoryId = :category_id', { category_id });
        }
        if (amenity_ids && amenity_ids.length > 0) {
            const ids = amenity_ids;
            queryBuilder
                .innerJoin('post.amenities', 'amenity')
                .andWhere('amenity.id IN (:...ids)', { ids })
                .groupBy('post.id, category.id, images.id')
                .having('COUNT(DISTINCT amenity.id) = :count', { count: ids.length });
        }
        queryBuilder.orderBy('post.createdAt', 'DESC');
        return queryBuilder.getMany();
    }
    async findOne(id) {
        const post = await this.postRepository.findOne({
            where: {
                id: id,
                status: 'approved',
            },
            relations: [
                'category',
                'amenities',
                'images',
                'user',
                'user.profile',
                'reviews',
                'reviews.user',
                'reviews.user.profile',
            ],
        });
        if (!post) {
            throw new common_1.NotFoundException('Không tìm thấy tin đăng hoặc tin chưa được duyệt');
        }
        if (post.user) {
            delete post.user.password_hash;
        }
        let averageRating = 0;
        if (post.reviews && post.reviews.length > 0) {
            const total = post.reviews.reduce((sum, review) => sum + review.rating, 0);
            averageRating = parseFloat((total / post.reviews.length).toFixed(1));
            post.reviews.forEach((review) => {
                if (review.user) {
                    delete review.user.password_hash;
                }
            });
        }
        return {
            ...post,
            averageRating: averageRating,
            reviewCount: post.reviews.length,
        };
    }
    async update(id, updatePostDto, user) {
        const post = await this.postRepository.findOneBy({ id });
        if (!post) {
            throw new common_1.NotFoundException('Không tìm thấy tin đăng');
        }
        if (post.userId !== user.userId) {
            throw new common_1.ForbiddenException('Bạn không có quyền sửa tin đăng này');
        }
        const { categoryId, amenityIds, imageUrls, ...postData } = updatePostDto;
        Object.assign(post, postData);
        if (categoryId) {
            const category = await this.categoryRepository.findOneBy({
                id: categoryId,
            });
            if (!category) {
                throw new common_1.NotFoundException('Không tìm thấy loại phòng');
            }
            post.category = category;
        }
        if (amenityIds) {
            const amenities = await this.amenityRepository.findBy({
                id: (0, typeorm_2.In)(amenityIds),
            });
            post.amenities = amenities;
        }
        if (imageUrls) {
            const images = imageUrls.map((url) => {
                const img = new post_image_entity_1.PostImageEntity();
                img.image_url = url;
                img.postId = post.id;
                return img;
            });
            post.images = images;
        }
        return this.postRepository.save(post);
    }
    async delete(id, user) {
        const post = await this.postRepository.findOneBy({ id });
        if (!post) {
            throw new common_1.NotFoundException('Không tìm thấy tin đăng');
        }
        if (post.userId !== user.userId) {
            throw new common_1.ForbiddenException('Bạn không có quyền xóa tin đăng này');
        }
        await this.postRepository.remove(post);
        return { message: 'Xóa tin đăng thành công' };
    }
};
exports.PostsService = PostsService;
exports.PostsService = PostsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(post_entity_1.PostEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(category_entity_1.CategoryEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(amenity_entity_1.AmenityEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PostsService);
//# sourceMappingURL=posts.service.js.map