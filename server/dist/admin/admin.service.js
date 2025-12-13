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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const post_entity_1 = require("../database/entities/post.entity");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../database/entities/user.entity");
let AdminService = class AdminService {
    postRepository;
    userRepository;
    constructor(postRepository, userRepository) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
    }
    async getAllPosts(status) {
        const options = {
            order: { createdAt: 'DESC' },
            relations: ['user', 'user.profile', 'category'],
        };
        if (status) {
            options.where = { status: status };
        }
        const posts = await this.postRepository.find(options);
        return posts.map((post) => {
            if (post.user) {
                delete post.user.password_hash;
            }
            return post;
        });
    }
    async updatePostStatus(id, updatePostStatusDto) {
        const post = await this.postRepository.findOneBy({ id });
        if (!post) {
            throw new common_1.NotFoundException('Không tìm thấy tin đăng');
        }
        post.status = updatePostStatusDto.status;
        return this.postRepository.save(post);
    }
    async getAllUsers() {
        const users = await this.userRepository.find({
            relations: ['role', 'profile'],
            where: {
                role: {
                    name: (0, typeorm_2.Not)('admin'),
                },
            },
            order: {
                createdAt: 'DESC',
            },
        });
        return users.map((user) => {
            const { password_hash, ...result } = user;
            return result;
        });
    }
    async updateUserStatus(id, updateUserStatusDto) {
        const user = await this.userRepository.findOne({
            where: { id: id },
            relations: ['role'],
        });
        if (!user) {
            throw new common_1.NotFoundException('Không tìm thấy người dùng');
        }
        if (user.role.name === 'admin') {
            throw new common_1.ForbiddenException('Bạn không có quyền thay đổi trạng thái của tài khoản Admin');
        }
        user.is_active = updateUserStatusDto.is_active;
        const savedUser = await this.userRepository.save(user);
        const { password_hash, ...result } = savedUser;
        return result;
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(post_entity_1.PostEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.UserEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], AdminService);
//# sourceMappingURL=admin.service.js.map