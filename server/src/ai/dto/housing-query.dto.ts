import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class HousingQueryDto {
  @IsString()
  @MaxLength(1000)
  message: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  districtOptions?: string[];
}
