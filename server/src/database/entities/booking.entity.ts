import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { PostEntity } from './post.entity';

@Entity({ name: 'bookings' })
export class BookingEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'post_id' })
  postId: number;

  @Column({ name: 'student_id' })
  studentId: number;

  @Column({ name: 'landlord_id' })
  landlordId: number;

  @Column({ type: 'date' })
  booking_date: string;

  @Column({ type: 'varchar', length: 50 })
  time_slot: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending', // pending, approved, rejected, cancelled
  })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Quan hệ với bài đăng
  @ManyToOne(() => PostEntity)
  @JoinColumn({ name: 'post_id' })
  post: PostEntity;

  // Quan hệ với người đi thuê (Sinh viên)
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'student_id' })
  student: UserEntity;

  // Quan hệ với chủ nhà
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'landlord_id' })
  landlord: UserEntity;
}
