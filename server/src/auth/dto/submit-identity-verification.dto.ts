import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const SUPPORTED_IDENTITY_DOCUMENT_TYPES = [
  'driver-license',
  'passport',
  'national-id',
] as const;

export class SubmitIdentityVerificationDto {
  @IsString()
  @IsIn(SUPPORTED_IDENTITY_DOCUMENT_TYPES)
  documentType: (typeof SUPPORTED_IDENTITY_DOCUMENT_TYPES)[number];

  @IsString()
  @MaxLength(255)
  frontImageName: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  backImageName?: string;
}
