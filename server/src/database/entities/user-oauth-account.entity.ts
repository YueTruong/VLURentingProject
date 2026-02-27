import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity({ name: 'user_oauth_accounts' })
@Unique('UQ_user_oauth_provider_account', ['provider', 'provider_account_id'])
@Unique('UQ_user_oauth_user_provider', ['user_id', 'provider'])
export class UserOauthAccountEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  user_id: number;

  @ManyToOne(() => UserEntity, (user) => user.oauthAccounts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'varchar', length: 50 })
  provider: string;

  @Column({ name: 'provider_account_id', type: 'varchar', length: 255 })
  provider_account_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @CreateDateColumn({ name: 'linked_at', type: 'timestamp' })
  linked_at: Date;

  @UpdateDateColumn({ name: 'last_used_at', type: 'timestamp' })
  last_used_at: Date;
}

