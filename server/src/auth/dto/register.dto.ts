import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
  IsPhoneNumber,
} from 'class-validator';

// Định nghĩa 2 vai trò mà người dùng có thể đăng ký
export enum UserRole {
  STUDENT = 'student',
  LANDLORD = 'landlord',
  ADMIN = 'admin',
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
  @IsEnum(UserRole, { message: 'Vai trò phải là student, landlord hoặc admin' })
  @IsNotEmpty({ message: 'Vai trò không được để trống.' })
  role: string;
}
