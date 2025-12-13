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
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const review_entity_1 = require("../database/entities/review.entity");
const post_entity_1 = require("../database/entities/post.entity");
let ReviewsService = class ReviewsService {
    reviewRepository;
    postRepository;
    constructor(reviewRepository, postRepository) {
        this.reviewRepository = reviewRepository;
        this.postRepository = postRepository;
    }
    async create(createReviewDto, user) {
        const { postId, rating, comment } = createReviewDto;
        const post = await this.postRepository.findOneBy({ id: postId });
        if (!post) {
            throw new common_1.NotFoundException('Tin đăng không tồn tại');
        }
        const existingReview = await this.reviewRepository.findOne({
            where: {
                userId: user.userId,
                postId: postId,
            },
        });
        if (existingReview) {
            throw new common_1.BadRequestException('Bạn đã đánh giá bài đăng này rồi');
        }
        const newReview = this.reviewRepository.create({
            rating,
            comment,
            userId: user.userId,
            post: post,
        });
        return this.reviewRepository.save(newReview);
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(review_entity_1.ReviewEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(post_entity_1.PostEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map