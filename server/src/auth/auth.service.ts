import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UserEntity } from 'src/database/entities/user.entity';
import { RoleEntity } from 'src/database/entities/role.entity';
import { UserProfileEntity } from 'src/database/entities/user-profile.entity';
import { UserOauthAccountEntity } from 'src/database/entities/user-oauth-account.entity';
import { RegisterDto } from './dto/register.dto';
import { OauthLoginDto } from './dto/oauth-login.dto';
import { LinkProviderDto } from './dto/link-provider.dto';

const SUPPORTED_OAUTH_PROVIDERS = ['google', 'facebook', 'apple'] as const;
type OAuthProvider = (typeof SUPPORTED_OAUTH_PROVIDERS)[number];

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(UserProfileEntity)
    private readonly profileRepository: Repository<UserProfileEntity>,
    @InjectRepository(UserOauthAccountEntity)
    private readonly oauthAccountRepository: Repository<UserOauthAccountEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, username, password, fullName, phoneNumber, role: roleName } = registerDto;

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email đã tồn tại');
    }

    const existingProfile = await this.profileRepository.findOne({
      where: { phone_number: phoneNumber },
    });
    if (existingProfile) {
      throw new ConflictException('Số điện thoại đã tồn tại');
    }

    const existingUsername = await this.userRepository.findOne({ where: { username } });
    if (existingUsername) {
      throw new ConflictException('Username đã tồn tại');
    }

    const userRole = await this.roleRepository.findOne({ where: { name: roleName } });
    if (!userRole) {
      throw new BadRequestException('Vai trò người dùng không hợp lệ');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new UserEntity();
    newUser.email = email;
    newUser.username = username;
    newUser.password_hash = hashedPassword;
    newUser.role = userRole;

    const newProfile = new UserProfileEntity();
    newProfile.full_name = fullName;
    newProfile.phone_number = phoneNumber;
    newUser.profile = newProfile;

    try {
      const savedUser = await this.userRepository.save(newUser);
      const { password_hash, ...safeUser } = savedUser;
      return safeUser;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Lỗi máy chủ, không thể đăng ký');
    }
  }

  async validateUser(identifier: string, pass: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: [{ email: identifier }, { username: identifier }],
      relations: ['role', 'profile'],
      select: ['id', 'email', 'username', 'password_hash', 'role', 'is_active', 'profile'],
    });

    if (!user) return null;
    if (user.is_active === false) return null;
    if (!user.password_hash) return null;

    const isPasswordMatching = await bcrypt.compare(pass, user.password_hash);
    if (!isPasswordMatching) return null;

    const result = { ...user };
    delete result.password_hash;
    delete result.is_active;
    return result;
  }

  async login(user: any) {
    const rawRole =
      typeof user.role === 'string'
        ? user.role
        : typeof user.role?.name === 'string'
          ? user.role.name
          : null;
    const roleName = rawRole?.toLowerCase() ?? 'student';
    const fullName = user.profile?.full_name ?? user.full_name ?? user.name ?? null;

    const payload = {
      sub: user.id,
      username: user.username ?? null,
      email: user.email ?? null,
      role: roleName,
      roles: roleName,
      full_name: fullName,
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
        full_name: fullName,
      },
    };
  }

  async oauthLogin(dto: OauthLoginDto, bridgeSecret?: string) {
    this.assertOAuthBridgeSecret(bridgeSecret);
    const provider = this.normalizeProvider(dto.provider);
    const providerAccountId = dto.providerAccountId.trim();
    const normalizedEmail = dto.email?.trim().toLowerCase();

    let oauthAccount = await this.oauthAccountRepository.findOne({
      where: { provider, provider_account_id: providerAccountId },
      relations: ['user', 'user.role', 'user.profile'],
    });

    if (oauthAccount) {
      if (oauthAccount.user?.is_active === false) {
        throw new UnauthorizedException('Tài khoản đang bị khóa');
      }
      oauthAccount.email = normalizedEmail ?? oauthAccount.email;
      oauthAccount.last_used_at = new Date();
      await this.oauthAccountRepository.save(oauthAccount);
      return this.login(oauthAccount.user);
    }

    const allowEmailLink =
      this.configService.get<string>('ALLOW_OAUTH_EMAIL_LINK')?.toLowerCase() !== 'false';

    let user: UserEntity | null = null;
    if (allowEmailLink && normalizedEmail) {
      user = await this.userRepository.findOne({
        where: { email: normalizedEmail },
        relations: ['role', 'profile'],
      });
      if (user?.is_active === false) {
        throw new UnauthorizedException('Tài khoản đang bị khóa');
      }
    }

    if (!allowEmailLink && normalizedEmail) {
      const existingByEmail = await this.userRepository.findOne({
        where: { email: normalizedEmail },
        select: ['id'],
      });
      if (existingByEmail) {
        throw new ConflictException(
          'Email đã tồn tại. Vui lòng đăng nhập và dùng chức năng liên kết tài khoản.',
        );
      }
    }

    if (!user) {
      user = await this.createOAuthUser(provider, providerAccountId, normalizedEmail, dto.fullName);
    }

    await this.upsertOAuthAccount(user.id, provider, providerAccountId, normalizedEmail);
    return this.login(user);
  }

  async linkProvider(userId: number | undefined, providerRaw: string, dto: LinkProviderDto) {
    if (!userId) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
    }

    const provider = this.normalizeProvider(providerRaw);
    const providerAccountId = dto.providerAccountId?.trim();
    if (!providerAccountId) {
      throw new BadRequestException('providerAccountId là bắt buộc');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role', 'profile'],
    });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    await this.upsertOAuthAccount(
      user.id,
      provider,
      providerAccountId,
      dto.email?.trim().toLowerCase(),
    );

    return {
      message: `Đã liên kết ${provider} thành công`,
    };
  }

  async unlinkProvider(userId: number | undefined, providerRaw: string) {
    if (!userId) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
    }

    const provider = this.normalizeProvider(providerRaw);
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['oauthAccounts'],
    });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const target = user.oauthAccounts?.find((item) => item.provider === provider);
    if (!target) {
      throw new NotFoundException('Provider chưa được liên kết');
    }

    const hasPassword = Boolean(user.password_hash && user.password_hash.trim().length > 0);
    const linkedCount = user.oauthAccounts?.length ?? 0;
    if (!hasPassword && linkedCount <= 1) {
      throw new BadRequestException(
        'Bạn cần đặt mật khẩu trước khi ngắt kết nối provider cuối cùng.',
      );
    }

    await this.oauthAccountRepository.remove(target);
    return {
      message: `Đã ngắt kết nối ${provider}`,
    };
  }

  async getSecurityOverview(userId: number | undefined, req: Request) {
    if (!userId) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['oauthAccounts'],
      select: ['id', 'password_hash', 'email'],
    });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const hasPassword = Boolean(user.password_hash && user.password_hash.trim().length > 0);
    const providers = SUPPORTED_OAUTH_PROVIDERS.map((provider) => {
      const linked = user.oauthAccounts?.find((item) => item.provider === provider);
      return {
        provider,
        connected: Boolean(linked),
        email: linked?.email ?? null,
        linkedAt: linked?.linked_at?.toISOString() ?? null,
        lastUsedAt: linked?.last_used_at?.toISOString() ?? null,
      };
    });

    const forwardedFor = req.headers['x-forwarded-for'];
    const ip =
      typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0]?.trim()
        : req.ip ?? req.socket.remoteAddress ?? null;

    const userAgent = req.headers['user-agent'] ?? 'Unknown';
    const sessions = [
      {
        id: 'current',
        device: userAgent,
        ip,
        lastUsedAt: new Date().toISOString(),
        current: true,
      },
    ];

    return {
      hasPassword,
      providers,
      sessions,
    };
  }

  async getProfile(userId: number | undefined) {
    if (!userId) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
    }

    const userProfile = await this.profileRepository.findOne({
      where: { userId },
    });
    if (!userProfile) {
      throw new NotFoundException('Không tìm thấy thông tin profile');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    return {
      email: user?.email ?? null,
      role: user?.role?.name ?? null,
      ...userProfile,
    };
  }

  private normalizeProvider(providerRaw: string): OAuthProvider {
    const provider = providerRaw?.trim().toLowerCase() as OAuthProvider;
    if (!SUPPORTED_OAUTH_PROVIDERS.includes(provider)) {
      throw new BadRequestException('Provider không được hỗ trợ');
    }
    return provider;
  }

  private assertOAuthBridgeSecret(secretFromHeader?: string) {
    const expectedSecret = this.configService.get<string>('OAUTH_BRIDGE_SECRET');
    if (!expectedSecret) return;
    if (!secretFromHeader || secretFromHeader !== expectedSecret) {
      throw new UnauthorizedException('OAuth bridge secret không hợp lệ');
    }
  }

  private async upsertOAuthAccount(
    userId: number,
    provider: OAuthProvider,
    providerAccountId: string,
    email?: string,
  ) {
    const existsByProviderAccount = await this.oauthAccountRepository.findOne({
      where: { provider, provider_account_id: providerAccountId },
    });
    if (existsByProviderAccount && existsByProviderAccount.user_id !== userId) {
      throw new ConflictException('Tài khoản OAuth này đã liên kết với người dùng khác');
    }

    const existingByUserProvider = await this.oauthAccountRepository.findOne({
      where: { user_id: userId, provider },
    });

    const now = new Date();
    if (existingByUserProvider) {
      existingByUserProvider.provider_account_id = providerAccountId;
      existingByUserProvider.email = email ?? existingByUserProvider.email;
      existingByUserProvider.last_used_at = now;
      await this.oauthAccountRepository.save(existingByUserProvider);
      return existingByUserProvider;
    }

    const created = this.oauthAccountRepository.create({
      user_id: userId,
      provider,
      provider_account_id: providerAccountId,
      email: email ?? null,
      linked_at: now,
      last_used_at: now,
    });
    return this.oauthAccountRepository.save(created);
  }

  private async createOAuthUser(
    provider: OAuthProvider,
    providerAccountId: string,
    email?: string,
    fullName?: string,
  ) {
    const role = await this.roleRepository.findOne({
      where: {
        name: In(['student', 'STUDENT']),
      },
    });
    if (!role) {
      throw new InternalServerErrorException('Thiếu role mặc định cho tài khoản OAuth');
    }

    const normalizedEmail =
      email?.trim().toLowerCase() ??
      `${provider}_${providerAccountId}@oauth.local`;

    const username = await this.generateUniqueUsername(normalizedEmail);
    const user = this.userRepository.create({
      email: normalizedEmail,
      username,
      password_hash: null,
      role,
      is_active: true,
    });

    const profile = this.profileRepository.create({
      full_name: fullName?.trim() || username,
    });
    user.profile = profile;

    return this.userRepository.save(user);
  }

  private async generateUniqueUsername(source: string) {
    const localPart = source.split('@')[0] ?? 'user';
    const base = localPart
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '')
      .replace(/^[._-]+|[._-]+$/g, '') || 'user';

    let candidate = base;
    let attempt = 0;
    while (attempt < 1000) {
      const exists = await this.userRepository.findOne({
        where: { username: candidate },
        select: ['id'],
      });
      if (!exists) return candidate;
      attempt += 1;
      candidate = `${base}${attempt}`;
    }

    throw new InternalServerErrorException('Không thể tạo username duy nhất');
  }
}
