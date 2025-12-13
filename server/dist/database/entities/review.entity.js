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
exports.ReviewEntity = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const post_entity_1 = require("./post.entity");
let ReviewEntity = class ReviewEntity {
    id;
    rating;
    comment;
    createdAt;
    userId;
    postId;
    user;
    post;
};
exports.ReviewEntity = ReviewEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ReviewEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], ReviewEntity.prototype, "rating", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ReviewEntity.prototype, "comment", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ReviewEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", Number)
], ReviewEntity.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'post_id' }),
    __metadata("design:type", Number)
], ReviewEntity.prototype, "postId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.UserEntity),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.UserEntity)
], ReviewEntity.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => post_entity_1.PostEntity, (post) => post.reviews, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'post_id' }),
    __metadata("design:type", post_entity_1.PostEntity)
], ReviewEntity.prototype, "post", void 0);
exports.ReviewEntity = ReviewEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'reviews' })
], ReviewEntity);
//# sourceMappingURL=review.entity.js.map