import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateReviewDto {
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
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  comment?: string;
}
