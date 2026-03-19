import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Patch,
  Param,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('bookings')
@UseGuards(JwtAuthGuard) // Bắt buộc đăng nhập
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  async create(@Body() createBookingDto: CreateBookingDto, @Req() req) {
    // req.user.id được lấy từ JWT Token sau khi đi qua Guard
    return await this.bookingsService.create(createBookingDto, req.user.id);
  }

  @Get('my-bookings')
  async getMyBookings(@Req() req) {
    return await this.bookingsService.findByStudent(req.user.id);
  }

  @Get('landlord-bookings')
  async getLandlordBookings(@Req() req) {
    // Lấy danh sách bookings mà landlord_id là ID của người đang đăng nhập
    return await this.bookingsService.findByLandlord(req.user.id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: number,
    @Body('status') status: string,
    @Req() req,
  ) {
    // Cập nhật trạng thái (approved/rejected)
    return await this.bookingsService.updateStatus(id, status, req.user.id);
  }

  @Patch(':id/cancel') // ✅ Khai báo đường dẫn xử lý lệnh Hủy
  @UseGuards(JwtAuthGuard)
  async cancel(@Param('id') id: number, @Req() req) {
    // Gọi hàm cancel trong service mà thầy đã hướng dẫn ở tin nhắn trước
    return await this.bookingsService.cancel(id, req.user.id);
  }
}
