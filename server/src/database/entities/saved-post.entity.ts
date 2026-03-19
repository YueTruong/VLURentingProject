import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { PostEntity } from './post.entity';

@Entity({ name: 'saved_posts' })
@Unique('UQ_saved_posts_user_post', ['userId', 'postId'])
export class SavedPostEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('IDX_saved_posts_user_id')
  @Column({ name: 'user_id' })
  userId: number;

  @Index('IDX_saved_posts_post_id')
  @Column({ name: 'post_id' })
  postId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => PostEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: PostEntity;
}
