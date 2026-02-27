import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LinkProviderDto {
  @IsString()
  @IsNotEmpty()
  providerAccountId: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}

