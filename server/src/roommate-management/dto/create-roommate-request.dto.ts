import { IsEnum, IsInt, IsString, Max, Min } from 'class-validator';

export class CreateRoommateRequestDto {
  @IsInt()
  listingId: number;

  @IsString()
  title: string;

  @IsInt()
  @Min(1)
  @Max(10)
  requestedSlots: number;

  @IsEnum(['LANDLORD_ASSIST', 'TENANT_SELF'])
  mode: 'LANDLORD_ASSIST' | 'TENANT_SELF';
}
