import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  // Không dùng @IsEmail nữa, vì user có thể nhập username (vd: "admin123")
  @IsNotEmpty({ message: 'Tài khoản không được để trống' })
  @IsString()
  username: string; // Biến này sẽ chứa Email HOẶC Username

  @IsNotEmpty()
  @IsString()
  password: string;
}
