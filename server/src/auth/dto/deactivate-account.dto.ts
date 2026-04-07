import { IsOptional, IsString } from 'class-validator';

export class DeactivateAccountDto {
  @IsString()
  @IsOptional()
  currentPassword?: string;
}
