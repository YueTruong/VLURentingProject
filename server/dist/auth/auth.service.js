"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../database/entities/user.entity");
const role_entity_1 = require("../database/entities/role.entity");
const user_profile_entity_1 = require("../database/entities/user-profile.entity");
const bcrypt = __importStar(require("bcryptjs"));
const jwt_1 = require("@nestjs/jwt");
let AuthService = class AuthService {
    userRepository;
    roleRepository;
    profileRepository;
    jwtService;
    constructor(userRepository, roleRepository, profileRepository, jwtService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.profileRepository = profileRepository;
        this.jwtService = jwtService;
    }
    async register(registerDto) {
        const { email, password, fullName, phoneNumber, role: roleName, } = registerDto;
        const existingUser = await this.userRepository.findOne({
            where: { email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email đã tồn tại');
        }
        const existingProfile = await this.profileRepository.findOne({
            where: { phone_number: phoneNumber },
        });
        if (existingProfile) {
            throw new common_1.ConflictException('Số điện thoại đã tồn tại');
        }
        const userRole = await this.roleRepository.findOne({
            where: { name: roleName },
        });
        if (!userRole) {
            throw new common_1.BadRequestException('Vai trò người dùng không hợp lệ');
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new user_entity_1.UserEntity();
        newUser.email = email;
        newUser.password_hash = hashedPassword;
        newUser.role = userRole;
        const newProfile = new user_profile_entity_1.UserProfileEntity();
        newProfile.full_name = fullName;
        newProfile.phone_number = phoneNumber;
        newUser.profile = newProfile;
        try {
            const savedUser = await this.userRepository.save(newUser);
            delete savedUser.password_hash;
            delete savedUser.role;
            return savedUser;
        }
        catch (error) {
            console.log(error);
            throw new common_1.InternalServerErrorException('Lỗi máy chủ, không thể đăng ký');
        }
    }
    async validateUser(email, pass) {
        const user = await this.userRepository.findOne({
            where: { email },
            relations: ['role'],
            select: ['id', 'email', 'password_hash', 'role', 'is_active'],
        });
        if (!user || user.is_active === false) {
            return null;
        }
        const isPasswordMatching = await bcrypt.compare(pass, user.password_hash);
        if (user && isPasswordMatching) {
            const { password_hash, is_active, ...result } = user;
            return result;
        }
        return null;
    }
    async login(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role.name,
        };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }
    async getProfile(userId) {
        const userProfile = await this.profileRepository.findOne({
            where: { userId: userId },
        });
        if (!userProfile) {
            throw new common_1.NotFoundException('Không tìm thấy thông tin profile');
        }
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['role'],
        });
        return {
            email: user.email,
            role: user.role.name,
            ...userProfile,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.UserEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(role_entity_1.RoleEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(user_profile_entity_1.UserProfileEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map