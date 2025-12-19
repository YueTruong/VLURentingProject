import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { RoleEntity } from './role.entity';
import { UserProfileEntity } from './user-profile.entity';
import { PostEntity } from './post.entity';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255 })
  password_hash: string;

  // Cột này sẽ lưu ID của vai trò
  @Column({ name: 'role_id' })
  roleId: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  // Định nghĩa mối quan hệ Nhiều-Một
  // Nhiều Người dùng (User) có thể có chung một Vai trò (Role)
  @ManyToOne(() => RoleEntity, (role) => role.users)
  @JoinColumn({ name: 'role_id' }) // Chỉ định khóa ngoại
  role: RoleEntity;
  @OneToOne(() => UserProfileEntity, (profile) => profile.user, {
    cascade: true, // Tự động tạo/cập nhật profile khi tạo/cập nhật user
  })
  profile: UserProfileEntity;

  // Một User Chủ trọ có thể đăng nhiều Post
  @OneToMany(() => PostEntity, (post) => post.user)
  posts: PostEntity[];
}
