import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingEntity } from '../database/entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { NotificationEntity } from 'src/database/entities/notification.entity';

@Injectable()
export class BookingsService {
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

      // ✅ 1. TẠO THÔNG BÁO CHO CHỦ TRỌ
      try {
        await this.notificationRepository.save({
          userId: landlordId, // Gửi cho chủ trọ
          title: 'Yêu cầu xem phòng mới',
          message: `Một sinh viên muốn hẹn xem phòng vào ngày ${bookingDate} (${timeSlot}).`,
          type: 'booking', // Loại này khớp với frontend em đã sửa
          relatedId: postId,
          isRead: false,
        });
      } catch (notifError) {
        console.error('Lỗi khi tạo thông báo cho chủ trọ:', notifError);
        // Không throw lỗi ở đây để tránh làm hỏng luồng lưu booking chính
      }

      return savedBooking;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw new InternalServerErrorException('Không thể tạo lịch hẹn.');
    }
  }

  async findByStudent(studentId: number) {
    return await this.bookingRepository.find({
      where: { studentId },
      relations: ['post', 'post.images', 'landlord', 'landlord.profile'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByLandlord(landlordId: number) {
    return await this.bookingRepository.find({
      where: { landlordId },
      relations: ['post', 'student', 'student.profile'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(id: number, status: string, landlordId: number) {
    // Tìm lịch hẹn kèm thông tin bài đăng để lấy title
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['post'],
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy lịch hẹn.');
    }

    if (booking.landlordId !== landlordId) {
      throw new ForbiddenException(
        'Bạn không có quyền thực hiện thao tác này.',
      );
    }

    booking.status = status;
    const updatedBooking = await this.bookingRepository.save(booking);

    // ✅ 2. TẠO THÔNG BÁO CHO SINH VIÊN KHI TRẠNG THÁI THAY ĐỔI
    try {
      const statusText = status === 'approved' ? 'chấp nhận' : 'từ chối';
      await this.notificationRepository.save({
        userId: booking.studentId, // Gửi cho sinh viên
        title: 'Cập nhật lịch xem phòng',
        message: `Chủ trọ đã ${statusText} lịch hẹn xem phòng "${booking.post?.title || 'bài đăng'}" của bạn.`,
        type: 'booking',
        relatedId: booking.postId,
        isRead: false,
      });
    } catch (notifError) {
      console.error('Lỗi khi tạo thông báo cho sinh viên:', notifError);
    }

    return updatedBooking;
  }

  // server/src/bookings/bookings.service.ts

  async cancel(id: number, userId: number) {
    // 1. Tìm lịch hẹn
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['post'],
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy lịch hẹn.');
    }

    // 2. Kiểm tra quyền: Chỉ sinh viên đặt lịch HOẶC chủ nhà của phòng đó mới được hủy
    if (booking.studentId !== userId && booking.landlordId !== userId) {
      throw new ForbiddenException('Bạn không có quyền hủy lịch hẹn này.');
    }

    // 3. Cập nhật trạng thái
    booking.status = 'cancelled';
    const saved = await this.bookingRepository.save(booking);

    // 4. TẠO THÔNG BÁO CHO ĐỐI PHƯƠNG
    // Nếu sinh viên hủy -> báo cho chủ nhà. Nếu chủ nhà hủy -> báo cho sinh viên.
    const receiverId =
      userId === booking.studentId ? booking.landlordId : booking.studentId;
    const senderType = userId === booking.studentId ? 'Sinh viên' : 'Chủ trọ';

    await this.notificationRepository.save({
      userId: receiverId,
      title: 'Lịch hẹn đã bị hủy',
      message: `${senderType} đã hủy lịch xem phòng "${booking.post?.title || 'bài đăng'}".`,
      type: 'booking',
      relatedId: booking.postId,
      isRead: false,
    });

    return saved;
  }
}
