import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class SearchPostDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return undefined;
    }

    const keyword = value.trim();
    return keyword.length > 0 ? keyword : undefined;
  })
  @IsString()
  @MaxLength(100)
  keyword?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
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
  category_id?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    return String(value)
      .split(',')
      .map((id) => Number(id.trim()));
  })
  @IsArray()
  @IsNumber({}, { each: true })
  amenity_ids?: number[];

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lat?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lng?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  radius?: number;

  @IsOptional()
  @IsString()
  campus?: 'CS1' | 'CS2' | 'CS3';

  @IsOptional()
  @IsString()
  availability?: 'available' | 'rented';
}
