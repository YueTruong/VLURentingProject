import { AdminService } from './admin.service';
import { UpdatePostStatusDto } from './dto/update-post-status.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getAllPosts(status: string): Promise<import("../database/entities/post.entity").PostEntity[]>;
    updatePostStatus(id: number, updatePostStatusDto: UpdatePostStatusDto): Promise<{
        message: string;
        data: import("../database/entities/post.entity").PostEntity;
    }>;
    getAllUsers(): Promise<{
        id: number;
        email: string;
        roleId: number;
        is_active: boolean;
        createdAt: Date;
        updatedAt: Date;
        role: import("../database/entities/role.entity").RoleEntity;
        profile: import("../database/entities/user-profile.entity").UserProfileEntity;
        posts: import("../database/entities/post.entity").PostEntity[];
    }[]>;
    updateUserStatus(id: number, UpdateUserStatusDto: UpdateUserStatusDto): Promise<{
        message: string;
        data: {
            id: number;
            email: string;
            roleId: number;
            is_active: boolean;
            createdAt: Date;
            updatedAt: Date;
            role: import("../database/entities/role.entity").RoleEntity;
            profile: import("../database/entities/user-profile.entity").UserProfileEntity;
            posts: import("../database/entities/post.entity").PostEntity[];
        };
    }>;
}
