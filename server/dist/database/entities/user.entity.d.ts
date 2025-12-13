import { RoleEntity } from './role.entity';
import { UserProfileEntity } from './user-profile.entity';
import { PostEntity } from './post.entity';
export declare class UserEntity {
    id: number;
    email: string;
    password_hash: string;
    roleId: number;
    is_active: boolean;
    createdAt: Date;
    updatedAt: Date;
    role: RoleEntity;
    profile: UserProfileEntity;
    posts: PostEntity[];
}
