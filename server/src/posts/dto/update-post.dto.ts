import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Max,
  Min,
  IsOptional,
  IsArray,
  IsInt,
  IsLatitude,
  IsLongitude,
} from 'class-validator';

export class UpdatePostDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @Max(9999999999.99)
  @IsOptional()
  price?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  area?: number;

  @IsString()
  @IsOptional()
  address?: string;

  @IsLatitude()
  @IsOptional()
  latitude?: number;

  @IsLongitude()
  @IsOptional()
  longitude?: number;

  @IsNumber()
  @IsInt()
  @Min(1)
  @IsOptional()
  max_occupancy?: number;

  @IsNumber()
  @IsInt()
  @IsOptional()
  categoryId?: number; // ID của Loại phòng

  // Mảng các ID của Tiện ích, ví dụ: [1, 3, 5]
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  amenityIds?: number[];

  // Mảng các URL của ảnh
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  imageUrls?: string[];

  // Chủ trọ có thể cập nhật trạng thái bài đăng
  @IsString()
  @IsOptional()
  status?: 'approved' | 'rented' | 'hidden';
}
