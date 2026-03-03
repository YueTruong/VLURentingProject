import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateBookingDto {
  @IsNotEmpty()
  @IsNumber()
  postId: number;

  @IsNotEmpty()
  @IsNumber()
  landlordId: number;

  @IsNotEmpty()
  @IsString()
  bookingDate: string;

  @IsNotEmpty()
  @IsString()
  timeSlot: string;

  @IsOptional()
  @IsString()
  note?: string;
}
