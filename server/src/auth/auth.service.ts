import {
  Injectable,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/database/entities/user.entity';
import { RoleEntity } from 'src/database/entities/role.entity';
import { UserProfileEntity } from 'src/database/entities/user-profile.entity';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  // Inject các Repository vào service để thao tác với database
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,

    @InjectRepository(UserProfileEntity)
    private readonly profileRepository: Repository<UserProfileEntity>,

    private readonly jwtService: JwtService,
  ) {}

  // Logic xử lý đăng ký tài khoản mới
  // @param registerDto Dữ liệu đăng ký từ client (đã được validate)
  async register(registerDto: RegisterDto) {
    const {
      email,
      password,
      fullName,
      phoneNumber,
      role: roleName,
    } = registerDto;

    // Kiểm tra sự tồn tại của Email và SĐT
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email đã tồn tại');
    }

    const existingProfile = await this.profileRepository.findOne({
      where: { phone_number: phoneNumber },
    });
    if (existingProfile) {
      throw new ConflictException('Số điện thoại đã tồn tại');
    }

    // --- 2. Tìm Role (vai trò) ---
    // Chúng ta giả định đã chèn 'student' và 'owner' vào bảng 'roles'
    // (Từ file SQL DDL ở bước 1)
    const userRole = await this.roleRepository.findOne({
      where: { name: roleName }, // roleName là 'student' hoặc 'owner'
    });

    if (!userRole) {
      throw new BadRequestException('Vai trò người dùng không hợp lệ');
    }

    // --- 3. Băm (hash) mật khẩu ---
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // --- 4. Tạo các thực thể (Entities) mới ---
    const newUser = new UserEntity();
    newUser.email = email;
    newUser.password_hash = hashedPassword;
    newUser.role = userRole; // Gán đối tượng RoleEntity

    const newProfile = new UserProfileEntity();
    newProfile.full_name = fullName;
    newProfile.phone_number = phoneNumber;

    // --- 5. Liên kết User và Profile ---
    newUser.profile = newProfile;
    // newProfile.user = newUser; // Không cần gán 2 chiều vì cascade=true

    // --- 6. Lưu vào Database ---
    try {
      // Vì chúng ta đã cài đặt cascade: true cho quan hệ user.profile
      // nên khi lưu user, profile liên kết cũng sẽ tự động được lưu.
      const savedUser = await this.userRepository.save(newUser);

      // Xóa mật khẩu trước khi trả về
      delete savedUser.password_hash;

      // Xóa role (không cần trả về)
      delete savedUser.role;

      return savedUser;
    } catch (error) {
      console.log(error);
      // Bắt các lỗi chung (ví dụ: lỗi database)
      throw new InternalServerErrorException('Lỗi máy chủ, không thể đăng ký');
    }
  }

  // Hàm xác thực người dùng trong LocalStrategy
  async validateUser(identifier: string, pass: string): Promise<any> {
    console.log(`🔍 [AuthService] Tìm user với identifier: ${identifier}`);

    // LOGIC TÌM KIẾM KÉP (Username HOẶC Email)
    const user = await this.userRepository.findOne({
      where: [
        { email: identifier }, // Tìm theo email
        { username: identifier }, // Tìm theo username
      ],
      relations: ['role'],
      select: ['id', 'email', 'username', 'password_hash', 'role', 'is_active'],
    });

    // TRƯỜNG HỢP 1: Không tìm thấy email hoặc username
    if (!user) {
      console.log('❌ Không tìm thấy user nào khớp email hoặc username.');
      return null;
    }

    console.log(`✅ [AuthService] 2. Tìm thấy User ID: ${user.id}`);
    console.log(`Checking Status: is_active = ${user.is_active}`);

    // TRƯỜNG HỢP 2: Tài khoản chưa kích hoạt
    if (user.is_active === false) {
      console.log(
        '❌ [AuthService] -> Lỗi: Tài khoản chưa kích hoạt (is_active = false)',
      );
      return null;
    }

    // So sánh mật khẩu
    console.log('🔍 [AuthService] 3. Đang so sánh mật khẩu...');
    console.log('   - Pass nhập vào:', pass);
    console.log('   - Hash trong DB:', user.password_hash);

    const isPasswordMatching = await bcrypt.compare(pass, user.password_hash);
    console.log('⚖️ [AuthService] Kết quả so sánh:', isPasswordMatching);

    // TRƯỜNG HỢP 3: Sai mật khẩu
    if (!isPasswordMatching) {
      console.log('❌ [AuthService] -> Lỗi: Mật khẩu không khớp!');
      return null;
    }

    if (user && isPasswordMatching) {
      console.log('✅ [AuthService] -> Đăng nhập thành công!');

      // 1. Clone object user ra một bản mới (để không ảnh hưởng bản gốc)
      const result = { ...user };

      // 2. Xóa các trường nhạy cảm
      delete result.password_hash;
      delete result.is_active;

      // 3. Trả về kết quả sạch
      return result;
    }

    return null;
  }

  // Hàm tạo JWT token sau khi đăng nhập thành công
  async login(user: any) {
    // Tạo payload cho JWT để lưu thông tin cần thiết
    const roleName = user.role?.name?.toLowerCase() ?? null;

    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: roleName,
      roles: roleName,
    };

    const access_token = this.jwtService.sign(payload);

      return {
        access_token,
        user: {
          id: user.id,
          email: user.email ?? null,
          username: user.username ?? null,
          role: roleName,
          roles: roleName,
        },
      };
  }

  // Hàm lấy thông tin Profile
  async getProfile(userId: number) {
    // Tìm thông tin profile dựa trên userId
    const userProfile = await this.profileRepository.findOne({
      where: { userId: userId },
    });

    if (!userProfile) {
      throw new NotFoundException('Không tìm thấy thông tin profile');
    }

    // Có thể lấy thêm thông tin user nếu cần
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    // Trả về thông tin profile kèm theo email và vai trò
    return {
      email: user.email,
      role: user.role.name,
      ...userProfile,
    };
  }
}
