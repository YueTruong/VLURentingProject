import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

// Định nghĩa các trạng thái hợp lệ mà Admin có thể set
// (Không bao gồm 'pending')
export enum PostStatusAdmin {
  APPROVED = 'approved',
  REJECTED = 'rejected',
  HIDDEN = 'hidden', // Admin cũng có thể ẩn tin
}

export class UpdatePostStatusDto {
  @IsEnum(PostStatusAdmin, {
    message: `Trạng thái phải là một trong các giá trị: ${Object.values(
      PostStatusAdmin,
    ).join(', ')}`,
  })
  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  status: PostStatusAdmin;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Lý do từ chối không được quá 500 ký tự' })
  rejectionReason?: string;
}
