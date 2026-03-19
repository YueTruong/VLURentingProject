import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NotificationEntity } from './notification.entity';
import { PostEntity } from './post.entity';
import { RoleEntity } from './role.entity';
import { UserOauthAccountEntity } from './user-oauth-account.entity';
import { UserProfileEntity } from './user-profile.entity';
import { UserSettingsEntity } from './user-settings.entity';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  username: string;

  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  password_hash: string | null;

  @Column({ name: 'role_id' })
  roleId: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => RoleEntity, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  role: RoleEntity;

  @OneToOne(() => UserProfileEntity, (profile) => profile.user, {
    cascade: true,
  })
  profile: UserProfileEntity;

  @OneToMany(() => PostEntity, (post) => post.user)
  posts: PostEntity[];

  @OneToMany(() => NotificationEntity, (notification) => notification.user)
  notifications: NotificationEntity[];

  @OneToMany(() => UserOauthAccountEntity, (oauthAccount) => oauthAccount.user)
  oauthAccounts: UserOauthAccountEntity[];

  @OneToOne(() => UserSettingsEntity, (settings) => settings.user, {
    cascade: true,
  })
  settings: UserSettingsEntity;
}
