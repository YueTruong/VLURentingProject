import { IsOptional, IsNumber, IsString, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class SearchPostDto {
  @IsOptional()
  @IsString()
  keyword?: string; // Cho tìm kiếm cơ bản (theo title, address)

  @IsOptional()
  @IsNumber()
  @Type(() => Number) // Tự động chuyển query param (string) thành number
  price_min?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  price_max?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  area_min?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  area_max?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  category_id?: number; // Lọc theo loại phòng

  // Lọc theo danh sách ID tiện ích (ví dụ: ?amenity_ids=1,2,3)
  @IsOptional()
  @Transform(({ value }) => {
    // Chuyển chuỗi '1,2,3' thành mảng ['1', '2', '3']
    return String(value)
      .split(',') // Tách theo dấu phẩy
      .map((id) => Number(id.trim())); // Chuyển từng phần tử sang số
  })
  @IsArray()
  @IsNumber({}, { each: true })
  amenity_ids?: number[];
}
