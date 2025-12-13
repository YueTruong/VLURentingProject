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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("./admin.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const update_post_status_dto_1 = require("./dto/update-post-status.dto");
const update_user_status_dto_1 = require("./dto/update-user-status.dto");
let AdminController = class AdminController {
    adminService;
    constructor(adminService) {
        this.adminService = adminService;
    }
    async getAllPosts(status) {
        return this.adminService.getAllPosts(status);
    }
    async updatePostStatus(id, updatePostStatusDto) {
        const updatedPost = await this.adminService.updatePostStatus(id, updatePostStatusDto);
        return {
            message: 'Cập nhật trạng thái tin đăng thành công',
            data: updatedPost,
        };
    }
    async getAllUsers() {
        return this.adminService.getAllUsers();
    }
    async updateUserStatus(id, UpdateUserStatusDto) {
        const updatedUser = await this.adminService.updateUserStatus(id, UpdateUserStatusDto);
        return {
            message: 'Cập nhật trạng thái người dùng thành công',
            data: updatedUser,
        };
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('/posts'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllPosts", null);
__decorate([
    (0, common_1.Patch)('/posts/:id/status'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_post_status_dto_1.UpdatePostStatusDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updatePostStatus", null);
__decorate([
    (0, common_1.Get)('/users'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllUsers", null);
__decorate([
    (0, common_1.Patch)('/users/:id/status'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_user_status_dto_1.UpdateUserStatusDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUserStatus", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map