import { PostEntity } from 'src/database/entities/post.entity';
import { Repository } from 'typeorm';
import { UpdatePostStatusDto } from './dto/update-post-status.dto';
import { UserEntity } from 'src/database/entities/user.entity';
import { UserProfileEntity } from 'src/database/entities/user-profile.entity';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
export declare class AdminService {
    private readonly postRepository;
    private readonly userRepository;
    constructor(postRepository: Repository<PostEntity>, userRepository: Repository<UserEntity>);
    getAllPosts(status?: string): Promise<PostEntity[]>;
    updatePostStatus(id: number, updatePostStatusDto: UpdatePostStatusDto): Promise<PostEntity>;
    getAllUsers(): Promise<{
        id: number;
        email: string;
        roleId: number;
        is_active: boolean;
        createdAt: Date;
        updatedAt: Date;
        role: import("../database/entities/role.entity").RoleEntity;
        profile: UserProfileEntity;
        posts: PostEntity[];
    }[]>;
    updateUserStatus(id: number, updateUserStatusDto: UpdateUserStatusDto): Promise<{
        id: number;
        email: string;
        roleId: number;
        is_active: boolean;
        createdAt: Date;
        updatedAt: Date;
        role: import("../database/entities/role.entity").RoleEntity;
        profile: UserProfileEntity;
        posts: PostEntity[];
    }>;
}
