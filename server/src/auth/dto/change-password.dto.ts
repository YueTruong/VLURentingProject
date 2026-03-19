import { IsOptional, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsOptional()
  currentPassword?: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}
