import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || typeof value === 'undefined') return undefined;
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? value : parsed;
    }
    return value;
  })
  @IsInt()
  postId?: number; // Đánh giá cho bài nào (tuỳ chọn)

  @IsInt()
  @Min(1)
  @Max(5) // Chỉ cho phép từ 1 đến 5 sao
  rating: number;

  @IsString()
  @IsNotEmpty()
  comment: string;
}
