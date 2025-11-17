import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { CategoryEntity } from './category.entity';
import { AmenityEntity } from './amenity.entity';
import { PostImageEntity } from './post-image.entity';
// Lấy kiểu 'post_status' từ file SQL DDL (hoặc định nghĩa ở đây)
// Tạm thời dùng string
type PostStatus = 'pending' | 'approved' | 'rejected' | 'rented' | 'hidden';

@Entity({ name: 'posts' })
export class PostEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ type: 'float' })
  area: number;

  @Column({ type: 'text' })
  address: string;

  @Column({ type: 'double precision', nullable: true })
  latitude: number;

  @Column({ type: 'double precision', nullable: true })
  longitude: number;

  @Column({ type: 'int', default: 1 })
  max_occupancy: number; // Số người ở tối đa

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'rejected', 'rented', 'hidden'],
    default: 'pending',
  })
  status: PostStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // CÁC QUAN HỆ

  @Column({ name: 'user_id' }) // Người đăng (chủ trọ)
  userId: number;

  @Column({ name: 'category_id' }) // Loại phòng
  categoryId: number;

  // Nhiều Post thuộc về Một User (Chủ trọ)
  @ManyToOne(() => UserEntity, (user) => user.posts)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  // Nhiều Post thuộc về Một Category
  @ManyToOne(() => CategoryEntity, (category) => category.posts)
  @JoinColumn({ name: 'category_id' })
  category: CategoryEntity;

  // Một Post có Nhiều Ảnh/Video
  @OneToMany(() => PostImageEntity, (image) => image.post, { cascade: true })
  images: PostImageEntity[];

  // Nhiều Post có Nhiều Tiện ích (Amenity)
  @ManyToMany(() => AmenityEntity, (amenity) => amenity.posts, {
    cascade: true,
  })
  @JoinTable({
    name: 'post_amenities', // Tên bảng trung gian
    joinColumn: { name: 'post_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'amenity_id', referencedColumnName: 'id' },
  })
  amenities: AmenityEntity[];
}
