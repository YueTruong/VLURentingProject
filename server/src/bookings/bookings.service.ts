import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from 'src/database/entities/notification.entity';
import { BookingEntity } from '../database/entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
  ) {}

  async create(createBookingDto: CreateBookingDto, studentId: number) {
    try {
      const { postId, landlordId, bookingDate, timeSlot, note } =
        createBookingDto;

      const newBooking = this.bookingRepository.create({
        postId,
        studentId,
        landlordId,
        booking_date: bookingDate,
        time_slot: timeSlot,
        note,
        status: 'pending',
      });

      const savedBooking = await this.bookingRepository.save(newBooking);

      try {
        await this.notificationRepository.save({
          userId: landlordId,
          title: 'Yeu cau xem phong moi',
          message: `Mot sinh vien muon hen xem phong vao ngay ${bookingDate} (${timeSlot}).`,
          type: 'booking',
          relatedId: postId,
          isRead: false,
        });
      } catch (notifError) {
        this.logger.warn(
          `Failed to create landlord booking notification: ${String(notifError)}`,
        );
      }

      return savedBooking;
    } catch (error) {
      this.logger.error('Error creating booking', error as Error);
      throw new InternalServerErrorException('Khong the tao lich hen.');
    }
  }

  async findByStudent(studentId: number) {
    return this.bookingRepository.find({
      where: { studentId },
      relations: ['post', 'post.images', 'landlord', 'landlord.profile'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByLandlord(landlordId: number) {
    return this.bookingRepository.find({
      where: { landlordId },
      relations: ['post', 'student', 'student.profile'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(id: number, status: string, landlordId: number) {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['post'],
    });

    if (!booking) {
      throw new NotFoundException('Khong tim thay lich hen.');
    }

    if (booking.landlordId !== landlordId) {
      throw new ForbiddenException('Ban khong co quyen thuc hien thao tac nay.');
    }

    booking.status = status;
    const updatedBooking = await this.bookingRepository.save(booking);

    try {
      const statusText = status === 'approved' ? 'chap nhan' : 'tu choi';
      await this.notificationRepository.save({
        userId: booking.studentId,
        title: 'Cap nhat lich xem phong',
        message: `Chu tro da ${statusText} lich hen xem phong "${booking.post?.title || 'bai dang'}" cua ban.`,
        type: 'booking',
        relatedId: booking.postId,
        isRead: false,
      });
    } catch (notifError) {
      this.logger.warn(
        `Failed to create student booking notification: ${String(notifError)}`,
      );
    }

    return updatedBooking;
  }

  async cancel(id: number, userId: number) {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['post'],
    });

    if (!booking) {
      throw new NotFoundException('Khong tim thay lich hen.');
    }

    if (booking.studentId !== userId && booking.landlordId !== userId) {
      throw new ForbiddenException('Ban khong co quyen huy lich hen nay.');
    }

    booking.status = 'cancelled';
    const saved = await this.bookingRepository.save(booking);

    const receiverId =
      userId === booking.studentId ? booking.landlordId : booking.studentId;
    const senderType = userId === booking.studentId ? 'Sinh vien' : 'Chu tro';

    await this.notificationRepository.save({
      userId: receiverId,
      title: 'Lich hen da bi huy',
      message: `${senderType} da huy lich xem phong "${booking.post?.title || 'bai dang'}".`,
      type: 'booking',
      relatedId: booking.postId,
      isRead: false,
    });

    return saved;
  }
}
