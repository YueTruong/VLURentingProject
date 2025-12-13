import { UserEntity } from './user.entity';
export declare class RoleEntity {
    id: number;
    name: string;
    users: UserEntity[];
}
