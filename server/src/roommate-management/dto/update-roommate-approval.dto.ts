import {
  IsBoolean,
  IsIn,
  IsOptional,
} from 'class-validator';

export class UpdateRoommateApprovalDto {
  @IsIn(['pending', 'approved', 'rejected'], {
    message: 'Trạng thái duyệt không hợp lệ',
  })
  approvalStatus: 'pending' | 'approved' | 'rejected';

  @IsOptional()
  @IsBoolean({ message: 'Trạng thái thông báo cho chủ trọ không hợp lệ' })
  notifyLandlord?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'Trạng thái đồng ý của chủ trọ không hợp lệ' })
  landlordConsent?: boolean;
}
