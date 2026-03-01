import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity({ name: 'user_settings' })
export class UserSettingsEntity {
  @PrimaryColumn({ name: 'user_id' })
  user_id: number;

  @OneToOne(() => UserEntity, (user) => user.settings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'preferred_name', type: 'varchar', length: 255, nullable: true })
  preferred_name: string | null;

  @Column({ name: 'residence_address', type: 'text', nullable: true })
  residence_address: string | null;

  @Column({ name: 'mailing_address', type: 'text', nullable: true })
  mailing_address: string | null;

  @Column({ name: 'emergency_name', type: 'varchar', length: 255, nullable: true })
  emergency_name: string | null;

  @Column({
    name: 'emergency_relationship',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  emergency_relationship: string | null;

  @Column({ name: 'emergency_email', type: 'varchar', length: 255, nullable: true })
  emergency_email: string | null;

  @Column({ name: 'emergency_phone', type: 'varchar', length: 50, nullable: true })
  emergency_phone: string | null;

  @Column({ name: 'language_code', type: 'varchar', length: 30, default: 'vi' })
  language_code: string;

  @Column({ name: 'currency_code', type: 'varchar', length: 10, default: 'VND' })
  currency_code: string;

  @Column({
    name: 'timezone',
    type: 'varchar',
    length: 80,
    default: 'Asia/Ho_Chi_Minh',
  })
  timezone: string;

  @Column({ name: 'read_receipts_enabled', type: 'boolean', default: true })
  read_receipts_enabled: boolean;

  @Column({ name: 'post_privacy_search_engine', type: 'boolean', default: true })
  post_privacy_search_engine: boolean;

  @Column({ name: 'post_privacy_hometown', type: 'boolean', default: false })
  post_privacy_hometown: boolean;

  @Column({ name: 'post_privacy_expert_type', type: 'boolean', default: false })
  post_privacy_expert_type: boolean;

  @Column({ name: 'post_privacy_joined_time', type: 'boolean', default: true })
  post_privacy_joined_time: boolean;

  @Column({ name: 'post_privacy_booked_services', type: 'boolean', default: false })
  post_privacy_booked_services: boolean;

  @Column({ name: 'stop_all_marketing_emails', type: 'boolean', default: false })
  stop_all_marketing_emails: boolean;

  @Column({ name: 'notify_offer_host_recognition', type: 'boolean', default: true })
  notify_offer_host_recognition: boolean;

  @Column({ name: 'notify_offer_trip_offers', type: 'boolean', default: true })
  notify_offer_trip_offers: boolean;

  @Column({ name: 'notify_offer_price_suggestions', type: 'boolean', default: true })
  notify_offer_price_suggestions: boolean;

  @Column({ name: 'notify_offer_host_perks', type: 'boolean', default: true })
  notify_offer_host_perks: boolean;

  @Column({ name: 'notify_offer_news_and_programs', type: 'boolean', default: true })
  notify_offer_news_and_programs: boolean;

  @Column({ name: 'notify_offer_local_regulations', type: 'boolean', default: true })
  notify_offer_local_regulations: boolean;

  @Column({ name: 'notify_offer_inspiration_and_deals', type: 'boolean', default: true })
  notify_offer_inspiration_and_deals: boolean;

  @Column({ name: 'notify_offer_trip_planning', type: 'boolean', default: true })
  notify_offer_trip_planning: boolean;

  @Column({ name: 'notify_account_new_device_login', type: 'boolean', default: true })
  notify_account_new_device_login: boolean;

  @Column({ name: 'notify_account_security_updates', type: 'boolean', default: true })
  notify_account_security_updates: boolean;

  @Column({ name: 'notify_account_payment_activity', type: 'boolean', default: true })
  notify_account_payment_activity: boolean;

  @Column({ name: 'notify_account_profile_reminders', type: 'boolean', default: true })
  notify_account_profile_reminders: boolean;

  @Column({
    name: 'notify_account_verification_reminders',
    type: 'boolean',
    default: true,
  })
  notify_account_verification_reminders: boolean;

  @Column({ name: 'notify_account_support_tips', type: 'boolean', default: true })
  notify_account_support_tips: boolean;

  @Column({
    name: 'identity_verification_status',
    type: 'varchar',
    length: 30,
    default: 'unverified',
  })
  identity_verification_status: string;

  @Column({
    name: 'identity_document_type',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  identity_document_type: string | null;

  @Column({
    name: 'identity_front_image_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  identity_front_image_name: string | null;

  @Column({
    name: 'identity_back_image_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  identity_back_image_name: string | null;

  @Column({ name: 'identity_submitted_at', type: 'timestamp', nullable: true })
  identity_submitted_at: Date | null;

  @Column({ name: 'identity_verified_at', type: 'timestamp', nullable: true })
  identity_verified_at: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updated_at: Date;
}
