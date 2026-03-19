import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateRoommateTrackingDto {
  @IsOptional()
  @IsBoolean({ message: 'Trạng thái thông báo cho chủ trọ không hợp lệ' })
  notifyLandlord?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'Trạng thái đồng ý của chủ trọ không hợp lệ' })
  landlordConsent?: boolean;
}
