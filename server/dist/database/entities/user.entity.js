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
exports.UserEntity = void 0;
const typeorm_1 = require("typeorm");
const role_entity_1 = require("./role.entity");
const user_profile_entity_1 = require("./user-profile.entity");
const post_entity_1 = require("./post.entity");
let UserEntity = class UserEntity {
    id;
    email;
    password_hash;
    roleId;
    is_active;
    createdAt;
    updatedAt;
    role;
    profile;
    posts;
};
exports.UserEntity = UserEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UserEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, unique: true }),
    __metadata("design:type", String)
], UserEntity.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], UserEntity.prototype, "password_hash", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'role_id' }),
    __metadata("design:type", Number)
], UserEntity.prototype, "roleId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], UserEntity.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], UserEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], UserEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => role_entity_1.RoleEntity, (role) => role.users),
    (0, typeorm_1.JoinColumn)({ name: 'role_id' }),
    __metadata("design:type", role_entity_1.RoleEntity)
], UserEntity.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_profile_entity_1.UserProfileEntity, (profile) => profile.user, {
        cascade: true,
    }),
    __metadata("design:type", user_profile_entity_1.UserProfileEntity)
], UserEntity.prototype, "profile", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => post_entity_1.PostEntity, (post) => post.user),
    __metadata("design:type", Array)
], UserEntity.prototype, "posts", void 0);
exports.UserEntity = UserEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'users' })
], UserEntity);
//# sourceMappingURL=user.entity.js.map