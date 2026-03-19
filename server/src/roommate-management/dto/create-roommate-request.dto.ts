import { IsBoolean, IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class CreateRoommateRequestDto {
  @IsInt({ message: 'Mã phòng gốc phải là số nguyên' })
  @Min(1, { message: 'Mã phòng gốc phải lớn hơn 0' })
  listingPostId: number;

  @IsInt({ message: 'Số người cần thêm phải là số nguyên' })
  @Min(1, { message: 'Số người cần thêm phải lớn hơn 0' })
  requestedSlots: number;

  @IsIn(['LANDLORD_ASSIST', 'TENANT_SELF'], {
    message: 'Hình thức ở ghép không hợp lệ',
  })
  mode: 'LANDLORD_ASSIST' | 'TENANT_SELF';

  @IsInt({ message: 'Số người hiện tại phải là số nguyên' })
  @Min(0, { message: 'Số người hiện tại không được nhỏ hơn 0' })
  currentOccupancy: number;

  @IsInt({ message: 'Sức chứa tối đa phải là số nguyên' })
  @Min(1, { message: 'Sức chứa tối đa phải lớn hơn 0' })
  maxOccupancy: number;

  @IsOptional()
  @IsBoolean({ message: 'Trạng thái thông báo cho chủ trọ không hợp lệ' })
  notifyLandlord?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'Trạng thái đồng ý của chủ trọ không hợp lệ' })
  landlordConsent?: boolean;
}
