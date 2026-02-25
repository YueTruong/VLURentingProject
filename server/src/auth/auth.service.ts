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
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,

    @InjectRepository(UserProfileEntity)
    private readonly profileRepository: Repository<UserProfileEntity>,

    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const {
      email,
      username,
      password,
      fullName,
      phoneNumber,
      role: roleName,
    } = registerDto;

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

    const existingUsername = await this.userRepository.findOne({
      where: { username },
    });
    if (existingUsername) {
      throw new ConflictException('Username đã tồn tại');
    }

    const userRole = await this.roleRepository.findOne({
      where: { name: roleName },
    });

    if (!userRole) {
      throw new BadRequestException('Vai trò người dùng không hợp lệ');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new UserEntity();
    newUser.email = email;
    newUser.password_hash = hashedPassword;
    newUser.role = userRole;
    newUser.username = username;

    const newProfile = new UserProfileEntity();
    newProfile.full_name = fullName;
    newProfile.phone_number = phoneNumber;

    newUser.profile = newProfile;

    try {
      const savedUser = await this.userRepository.save(newUser);
      delete savedUser.password_hash;
      delete savedUser.role;
      return savedUser;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Lỗi máy chủ, không thể đăng ký');
    }
  }

  async validateUser(identifier: string, pass: string): Promise<any> {
    console.log(`🔍 [AuthService] Tìm user với identifier: ${identifier}`);

    // ✅ SỬA Ở ĐÂY: Thêm relations 'profile' để lấy full_name
    const user = await this.userRepository.findOne({
      where: [{ email: identifier }, { username: identifier }],
      relations: ['role', 'profile'], // Thêm 'profile' vào đây!
      select: [
        'id',
        'email',
        'username',
        'password_hash',
        'role',
        'is_active',
        'profile',
      ],
    });

    if (!user) {
      console.log('❌ Không tìm thấy user nào khớp email hoặc username.');
      return null;
    }

    if (user.is_active === false) {
      console.log(
        '❌ [AuthService] -> Lỗi: Tài khoản chưa kích hoạt (is_active = false)',
      );
      return null;
    }

    const isPasswordMatching = await bcrypt.compare(pass, user.password_hash);

    if (!isPasswordMatching) {
      console.log('❌ [AuthService] -> Lỗi: Mật khẩu không khớp!');
      return null;
    }

    if (user && isPasswordMatching) {
      console.log('✅ [AuthService] -> Đăng nhập thành công!');
      const result = { ...user };
      delete result.password_hash;
      delete result.is_active;
      return result;
    }

    return null;
  }

  async login(user: any) {
    const roleName = user.role?.name?.toLowerCase() ?? null;
    // ✅ Bắt lấy full_name từ object profile
    const fullName = user.profile?.full_name ?? null;

    // ✅ Nhét full_name vào Token Payload
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: roleName,
      roles: roleName,
      full_name: fullName, // <-- CHÌA KHÓA NẰM Ở ĐÂY
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
        full_name: fullName, // <-- Trả thẳng về cho Frontend dễ đọc
      },
    };
  }


  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto) {
    const profile = await this.profileRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Không tìm thấy thông tin profile');
    }

    const normalizedPhone = updateProfileDto.phoneNumber?.trim();
    if (normalizedPhone) {
      const existedPhone = await this.profileRepository.findOne({
        where: { phone_number: normalizedPhone },
      });

      if (existedPhone && existedPhone.userId !== userId) {
        throw new ConflictException('Số điện thoại đã tồn tại');
      }
      profile.phone_number = normalizedPhone;
    } else if (typeof updateProfileDto.phoneNumber === 'string') {
      profile.phone_number = null;
    }

    if (typeof updateProfileDto.fullName === 'string') {
      profile.full_name = updateProfileDto.fullName.trim() || null;
    }

    if (typeof updateProfileDto.avatarUrl === 'string') {
      profile.avatar_url = updateProfileDto.avatarUrl.trim() || null;
    }

    if (typeof updateProfileDto.address === 'string') {
      profile.address = updateProfileDto.address.trim() || null;
    }

    const saved = await this.profileRepository.save(profile);

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    return {
      email: user?.email,
      role: user?.role?.name,
      ...saved,
    };
  }

  async getProfile(userId: number) {
    const userProfile = await this.profileRepository.findOne({
      where: { userId: userId },
    });

    if (!userProfile) {
      throw new NotFoundException('Không tìm thấy thông tin profile');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    return {
      email: user.email,
      role: user.role.name,
      ...userProfile,
    };
  }
}
