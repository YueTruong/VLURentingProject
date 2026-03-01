import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ManageAmenityDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  iconUrl?: string;
}
