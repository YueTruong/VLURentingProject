import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ConversationEntity } from './conversation.entity';
import { UserEntity } from './user.entity';

@Entity('messages')
export class MessageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ConversationEntity, (conversation) => conversation.messages)
  @JoinColumn({ name: 'conversation_id' })
  conversation: ConversationEntity;

  // Người gửi (có thể là Student hoặc Landlord)
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'sender_id' })
  sender: UserEntity;

  @Column('text')
  content: string;

  @CreateDateColumn()
  created_at: Date;
}
