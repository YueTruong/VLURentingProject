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
exports.UserProfileEntity = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
let UserProfileEntity = class UserProfileEntity {
    userId;
    full_name;
    phone_number;
    avatar_url;
    address;
    user;
};
exports.UserProfileEntity = UserProfileEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'user_id' }),
    __metadata("design:type", Number)
], UserProfileEntity.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], UserProfileEntity.prototype, "full_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, unique: true, nullable: true }),
    __metadata("design:type", String)
], UserProfileEntity.prototype, "phone_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], UserProfileEntity.prototype, "avatar_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], UserProfileEntity.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.UserEntity, (user) => user.profile, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.UserEntity)
], UserProfileEntity.prototype, "user", void 0);
exports.UserProfileEntity = UserProfileEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'user_profiles' })
], UserProfileEntity);
//# sourceMappingURL=user-profile.entity.js.map