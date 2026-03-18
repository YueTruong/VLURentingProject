import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { NotificationsService } from 'src/notifications/notifications.service';
import { ConversationEntity } from '../database/entities/conversation.entity';
import { MessageEntity } from '../database/entities/message.entity';
import { UserEntity } from '../database/entities/user.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ConversationEntity)
    private readonly conversationRepo: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepo: Repository<MessageEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
  ) {}

  async getConversation(studentId: number, landlordId: number) {
    if (!studentId || !landlordId || studentId === landlordId) {
      throw new BadRequestException('Invalid conversation participants');
    }

    let conversation = await this.conversationRepo.findOne({
      where: {
        studentId,
        landlordId,
      },
      relations: ['student', 'student.profile', 'landlord', 'landlord.profile'],
    });

    if (!conversation) {
      conversation = this.conversationRepo.create({
        studentId,
        landlordId,
        student: { id: studentId },
        landlord: { id: landlordId },
      });
      await this.conversationRepo.save(conversation);

      conversation = await this.conversationRepo.findOne({
        where: { id: conversation.id },
        relations: [
          'student',
          'student.profile',
          'landlord',
          'landlord.profile',
        ],
      });
    }

    if (!conversation) {
      throw new NotFoundException('Conversation could not be created');
    }

    return conversation;
  }

  async ensureConversationParticipant(conversationId: number, userId: number) {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Khong tim thay cuoc tro chuyen');
    }

    const isParticipant =
      conversation.studentId === userId || conversation.landlordId === userId;

    if (!isParticipant) {
      throw new ForbiddenException(
        'Ban khong co quyen truy cap cuoc tro chuyen nay',
      );
    }

    return conversation;
  }

  async saveMessage(
    conversationId: number,
    senderId: number,
    content: string,
    isReceiverWatching = false,
  ) {
    const normalizedContent = content?.trim();
    if (!normalizedContent) {
      throw new BadRequestException('Message content is required');
    }

    const transactionResult = await this.dataSource.transaction(
      async (manager) => {
        const conversationRepository =
          manager.getRepository(ConversationEntity);
        const messageRepository = manager.getRepository(MessageEntity);
        const userRepository = manager.getRepository(UserEntity);

        const conversation = await conversationRepository.findOne({
          where: { id: conversationId },
        });
        if (!conversation) {
          throw new NotFoundException('Khong tim thay cuoc tro chuyen');
        }

        const isParticipant =
          conversation.studentId === senderId ||
          conversation.landlordId === senderId;
        if (!isParticipant) {
          throw new ForbiddenException(
            'Ban khong co quyen gui tin nhan trong cuoc tro chuyen nay',
          );
        }

        const sender = await userRepository.findOne({
          where: { id: senderId },
          relations: ['profile'],
        });
        if (!sender) {
          throw new NotFoundException('Khong tim thay nguoi gui tin nhan');
        }

        const message = messageRepository.create({
          conversationId,
          senderId,
          conversation: { id: conversationId },
          sender: { id: senderId },
          content: normalizedContent,
        });
        const savedMessage = await messageRepository.save(message);

        await conversationRepository.update(conversationId, {
          updated_at: new Date(),
        });

        const receiverId =
          senderId === conversation.studentId
            ? conversation.landlordId
            : conversation.studentId;

        return {
          savedMessage,
          receiverId,
          senderName:
            sender.profile?.full_name || sender.email || 'Nguoi dung',
        };
      },
    );

    if (!isReceiverWatching) {
      await this.notificationsService.createNotification(
        transactionResult.receiverId,
        `Tin nhan moi tu ${transactionResult.senderName}`,
        'Dang cho ban phan hoi...',
        'message',
        senderId,
      );
    }

    const responseMessage = await this.messageRepo.findOne({
      where: { id: transactionResult.savedMessage.id },
      relations: ['sender'],
    });

    const nextMessage = responseMessage ?? transactionResult.savedMessage;
    nextMessage.conversation = { id: conversationId } as ConversationEntity;
    nextMessage.conversationId = conversationId;
    nextMessage.senderId = senderId;
    return nextMessage;
  }

  async getMessagesForUser(conversationId: number, userId: number) {
    await this.ensureConversationParticipant(conversationId, userId);
    return this.getMessages(conversationId);
  }

  async getMessages(conversationId: number) {
    return this.messageRepo.find({
      where: { conversationId },
      relations: ['sender'],
      order: { created_at: 'ASC' },
    });
  }

  async getUserConversations(userId: number) {
    const conversations = await this.conversationRepo.find({
      where: [{ studentId: userId }, { landlordId: userId }],
      relations: [
        'student',
        'student.profile',
        'landlord',
        'landlord.profile',
      ],
      order: { updated_at: 'DESC' },
    });

    if (conversations.length === 0) {
      return conversations;
    }

    const conversationIds = conversations.map((conversation) => conversation.id);
    const lastMessages = await this.messageRepo
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .distinctOn(['message.conversationId'])
      .where('message.conversationId IN (:...conversationIds)', {
        conversationIds,
      })
      .orderBy('message.conversationId', 'ASC')
      .addOrderBy('message.created_at', 'DESC')
      .addOrderBy('message.id', 'DESC')
      .getMany();

    const lastMessageByConversation = new Map<number, MessageEntity>();
    for (const message of lastMessages) {
      message.conversation = { id: message.conversationId } as ConversationEntity;
      lastMessageByConversation.set(message.conversationId, message);
    }

    return conversations.map((conversation) => ({
      ...conversation,
      messages: lastMessageByConversation.has(conversation.id)
        ? [lastMessageByConversation.get(conversation.id)!]
        : [],
    }));
  }
}
