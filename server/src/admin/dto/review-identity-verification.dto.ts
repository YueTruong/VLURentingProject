import { IsEnum } from 'class-validator';

export enum IdentityReviewStatus {
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export class ReviewIdentityVerificationDto {
  @IsEnum(IdentityReviewStatus)
  status: IdentityReviewStatus;
}
