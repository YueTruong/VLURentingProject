import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  @IsNotEmpty()
  postId: number; // Đánh giá cho bài nào

  @IsInt()
  @Min(1)
  @Max(5) // Chỉ cho phép từ 1 đến 5 sao
  rating: number;

  @IsString()
  @IsNotEmpty()
  comment: string;
}
