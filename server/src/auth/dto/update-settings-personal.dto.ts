import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSettingsPersonalDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  legalName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  preferredName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(3000)
  residenceAddress?: string;

  @IsString()
  @IsOptional()
  @MaxLength(3000)
  mailingAddress?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  emergencyName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  emergencyRelationship?: string;

  @IsEmail()
  @IsOptional()
  emergencyEmail?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  emergencyPhone?: string;
}
