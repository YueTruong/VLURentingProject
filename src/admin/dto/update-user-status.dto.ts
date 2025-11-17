import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateUserStatusDto {
  @IsBoolean({ message: 'Trạng thái phải là true hoặc false' })
  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  is_active: boolean;
}
