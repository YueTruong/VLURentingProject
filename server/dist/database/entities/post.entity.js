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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostEntity = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const category_entity_1 = require("./category.entity");
const amenity_entity_1 = require("./amenity.entity");
const post_image_entity_1 = require("./post-image.entity");
const review_entity_1 = require("./review.entity");
let PostEntity = class PostEntity {
    id;
    title;
    description;
    price;
    area;
    address;
    latitude;
    longitude;
    max_occupancy;
    status;
    createdAt;
    updatedAt;
    userId;
    categoryId;
    user;
    category;
    images;
    amenities;
    reviews;
};
exports.PostEntity = PostEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PostEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], PostEntity.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], PostEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], PostEntity.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float' }),
    __metadata("design:type", Number)
], PostEntity.prototype, "area", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], PostEntity.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision', nullable: true }),
    __metadata("design:type", Number)
], PostEntity.prototype, "latitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision', nullable: true }),
    __metadata("design:type", Number)
], PostEntity.prototype, "longitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], PostEntity.prototype, "max_occupancy", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['pending', 'approved', 'rejected', 'rented', 'hidden'],
        default: 'pending',
    }),
    __metadata("design:type", String)
], PostEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], PostEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], PostEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", Number)
], PostEntity.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'category_id' }),
    __metadata("design:type", Number)
], PostEntity.prototype, "categoryId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.UserEntity, (user) => user.posts),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.UserEntity)
], PostEntity.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => category_entity_1.CategoryEntity, (category) => category.posts),
    (0, typeorm_1.JoinColumn)({ name: 'category_id' }),
    __metadata("design:type", category_entity_1.CategoryEntity)
], PostEntity.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => post_image_entity_1.PostImageEntity, (image) => image.post, { cascade: true }),
    __metadata("design:type", Array)
], PostEntity.prototype, "images", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => amenity_entity_1.AmenityEntity, (amenity) => amenity.posts, {
        cascade: true,
    }),
    (0, typeorm_1.JoinTable)({
        name: 'post_amenities',
        joinColumn: { name: 'post_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'amenity_id', referencedColumnName: 'id' },
    }),
    __metadata("design:type", Array)
], PostEntity.prototype, "amenities", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => review_entity_1.ReviewEntity, (review) => review.post),
    __metadata("design:type", Array)
], PostEntity.prototype, "reviews", void 0);
exports.PostEntity = PostEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'posts' })
], PostEntity);
//# sourceMappingURL=post.entity.js.map