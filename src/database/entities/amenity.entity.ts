import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PostEntity } from './post.entity';

@Entity({ name: 'amenities' })
export class AmenityEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  icon_url: string;

  // Quan hệ Nhiều-Nhiều với PostEntity
  @ManyToMany(() => PostEntity, (post) => post.amenities)
  posts: PostEntity[];
}
