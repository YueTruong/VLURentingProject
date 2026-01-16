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

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  @Max(9999999999.99)
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
  @IsOptional()
  categoryId?: number;

  @IsString()
  @IsOptional()
  categoryName?: string;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  amenityIds?: number[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenityNames?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  imageUrls?: string[];
}
