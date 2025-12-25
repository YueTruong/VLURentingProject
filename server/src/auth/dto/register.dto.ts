import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
  IsPhoneNumber,
} from 'class-validator';

// Định nghĩa 2 vai trò mà người dùng có thể đăng ký
export enum RegisterRole {
  STUDENT = 'student',
  OWNER = 'owner',
}

export class RegisterDto {
  @IsEmail({}, { message: 'Email không hợp lệ.' })
  @IsNotEmpty({ message: 'Email không được để trống.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống.' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự.' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Họ tên không được để trống.' })
  fullName: string;

  @IsPhoneNumber('VN', { message: 'Số điện thoại không hợp lệ.' })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống.' })
  phoneNumber: string;

  // Vai trò người dùng muốn đăng ký
  @IsEnum(RegisterRole, { message: 'Vai trò không hợp lệ.' })
  @IsNotEmpty({ message: 'Vai trò không được để trống.' })
  role: RegisterRole; // 'student' hoặc 'owner'
}
