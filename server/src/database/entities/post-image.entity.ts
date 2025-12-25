import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PostEntity } from './post.entity';

@Entity({ name: 'post_images' })
export class PostImageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'post_id' })
  postId: number;

  @Column({ type: 'text' })
  image_url: string;

  @Column({ type: 'boolean', default: false })
  is_video: boolean;

  // Nhiều ảnh/video thuộc về Một Post
  @ManyToOne(() => PostEntity, (post) => post.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: PostEntity;
}
