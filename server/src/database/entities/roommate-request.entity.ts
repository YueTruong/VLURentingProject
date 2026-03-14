import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PostEntity } from './post.entity';
import { UserEntity } from './user.entity';

export type RoommateMode = 'LANDLORD_ASSIST' | 'TENANT_SELF';
export type RoommateApprovalStatus = 'pending' | 'approved' | 'rejected';

@Entity({ name: 'roommate_requests' })
export class RoommateRequestEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ name: 'listing_post_id' })
  listingPostId: number;

  @Column({ name: 'student_id' })
  studentId: number;

  @Column({ name: 'landlord_id', nullable: true })
  landlordId: number | null;

  @Column({ type: 'varchar', length: 20 })
  mode: RoommateMode;

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  approvalStatus: RoommateApprovalStatus;

  @Column({ type: 'int', default: 1 })
  requestedSlots: number;

  @Column({ type: 'boolean', default: false })
  notifyLandlord: boolean;

  @Column({ type: 'boolean', default: false })
  landlordConsent: boolean;

  @Column({ type: 'varchar', length: 255 })
  listingTitle: string;

  @Column({ type: 'text' })
  listingAddress: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  landlordName: string | null;

  @Column({ type: 'int', default: 0 })
  currentOccupancy: number;

  @Column({ type: 'int', default: 1 })
  maxOccupancy: number;

  @Column({ name: 'public_post_id', nullable: true })
  publicPostId: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => PostEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listing_post_id' })
  listingPost: PostEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: UserEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'landlord_id' })
  landlord: UserEntity | null;
}
