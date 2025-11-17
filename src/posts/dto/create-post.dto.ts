import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsArray,
  IsInt,
  IsLatitude,
  IsLongitude,
} from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  area: number;

  @IsString()
  @IsNotEmpty()
  address: string;

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
  categoryId: number; // ID của Loại phòng

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
}
