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
import { In, Not, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UserEntity } from 'src/database/entities/user.entity';
import { RoleEntity } from 'src/database/entities/role.entity';
import { UserProfileEntity } from 'src/database/entities/user-profile.entity';
import { UserOauthAccountEntity } from 'src/database/entities/user-oauth-account.entity';
import { UserSettingsEntity } from 'src/database/entities/user-settings.entity';
import { PostEntity } from 'src/database/entities/post.entity';
import { RegisterDto } from './dto/register.dto';
import { OauthLoginDto } from './dto/oauth-login.dto';
import { LinkProviderDto } from './dto/link-provider.dto';
import { UpdateSettingsPersonalDto } from './dto/update-settings-personal.dto';
import { UpdateSettingsPreferencesDto } from './dto/update-settings-preferences.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { DeactivateAccountDto } from './dto/deactivate-account.dto';
import { SubmitIdentityVerificationDto } from './dto/submit-identity-verification.dto';
import { LoginResponse, ValidatedUser } from './types/auth.types';

const SUPPORTED_OAUTH_PROVIDERS = ['google', 'facebook', 'apple'] as const;
type OAuthProvider = (typeof SUPPORTED_OAUTH_PROVIDERS)[number];
const SUPPORTED_IDENTITY_DOCUMENT_TYPES = [
  'driver-license',
  'passport',
  'national-id',
] as const;
type IdentityDocumentType = (typeof SUPPORTED_IDENTITY_DOCUMENT_TYPES)[number];
type IdentityVerificationStatus =
  | 'unverified'
  | 'pending'
  | 'verified'
  | 'rejected';
type LoginUser = Pick<
  ValidatedUser,
  'id' | 'email' | 'username' | 'role' | 'profile'
> & {
  full_name?: string | null;
  name?: string | null;
};

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
    @InjectRepository(UserSettingsEntity)
    private readonly userSettingsRepository: Repository<UserSettingsEntity>,
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim();
    const normalizedPhone = phoneNumber.trim();

    if (!normalizedUsername) {
      throw new BadRequestException('Username is required');
    }

    const existingUser = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const existingProfile = await this.profileRepository.findOne({
      where: { phone_number: normalizedPhone },
    });
    if (existingProfile) {
      throw new ConflictException('Phone number already exists');
    }

    const existingUsername = await this.userRepository.findOne({
      where: { username: normalizedUsername },
    });
    if (existingUsername) {
      throw new ConflictException('Username already exists');
    }

    const roleCandidates = Array.from(
      new Set([roleName, roleName.toLowerCase(), roleName.toUpperCase()]),
    );
    const userRole = await this.roleRepository.findOne({
      where: {
        name: In(roleCandidates),
      },
    });
    if (!userRole) {
      throw new BadRequestException('Invalid role');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new UserEntity();
    newUser.email = normalizedEmail;
    newUser.username = normalizedUsername;
    newUser.password_hash = hashedPassword;
    newUser.role = userRole;

    const newProfile = new UserProfileEntity();
    newProfile.full_name = fullName.trim();
    newProfile.phone_number = normalizedPhone;
    newProfile.user = newUser;
    newUser.profile = newProfile;

    try {
      const savedUser = await this.userRepository.save(newUser);

      // ✅ CÁCH GIẢI QUYẾT: Tự định nghĩa lại object trả về (DTO pattern)
      // Chỉ lấy những trường thực sự cần thiết, ngắt bỏ vòng lặp vô tận
      return this.buildRegisteredUserResponse(savedUser);
    } catch (error) {
      if (this.isUniqueConstraintViolation(error)) {
        throw this.buildRegistrationConflictException(error);
      }
      throw new InternalServerErrorException('Registration failed');
    }
  }

  async validateUser(
    identifier: string,
    pass: string,
  ): Promise<ValidatedUser | null> {
    const normalizedIdentifier = identifier.trim();
    const user = await this.userRepository.findOne({
      where: [
        { email: normalizedIdentifier.toLowerCase() },
        { username: normalizedIdentifier },
      ],
      relations: ['role', 'profile'],
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

    if (!user) return null;
    if (user.is_active === false) return null;
    if (!user.password_hash) return null;

    const isPasswordMatching = await bcrypt.compare(pass, user.password_hash);
    if (!isPasswordMatching) return null;

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: {
        id: user.role?.id,
        name: user.role?.name,
      },
      profile: user.profile
        ? {
            full_name: user.profile.full_name,
            phone_number: user.profile.phone_number,
            avatar_url: user.profile.avatar_url,
            address: user.profile.address,
          }
        : null,
    };
  }

  async login(user: LoginUser): Promise<LoginResponse> {
    const roleName = this.normalizeRoleName(user.role);
    const fullName =
      user.profile?.full_name ?? user.full_name ?? user.name ?? null;

    const payload = {
      sub: user.id,
      username: user.username ?? null,
      email: user.email ?? null,
      role: roleName,
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
        full_name: fullName,
      },
    };
  }

  async oauthLogin(dto: OauthLoginDto, bridgeSecret?: string) {
    this.assertOAuthBridgeSecret(bridgeSecret);
    const provider = this.normalizeProvider(dto.provider);
    const providerAccountId = dto.providerAccountId.trim();
    const normalizedEmail = this.normalizeOptionalEmail(dto.email);

    const oauthAccount = await this.oauthAccountRepository.findOne({
      where: { provider, provider_account_id: providerAccountId },
      relations: ['user', 'user.role', 'user.profile'],
    });

    if (oauthAccount) {
      if (oauthAccount.user?.is_active === false) {
        throw new UnauthorizedException('Account is blocked');
      }
      oauthAccount.email = normalizedEmail ?? oauthAccount.email;
      oauthAccount.last_used_at = new Date();
      await this.oauthAccountRepository.save(oauthAccount);
      return this.login(oauthAccount.user);
    }

    const allowEmailLink =
      this.configService
        .get<string>('ALLOW_OAUTH_EMAIL_LINK')
        ?.toLowerCase() !== 'false';

    let user: UserEntity | null = null;
    if (allowEmailLink && normalizedEmail) {
      user = await this.userRepository.findOne({
        where: { email: normalizedEmail },
        relations: ['role', 'profile'],
      });
      if (user?.is_active === false) {
        throw new UnauthorizedException('Account is blocked');
      }
    }

    if (!allowEmailLink && normalizedEmail) {
      const existingByEmail = await this.userRepository.findOne({
        where: { email: normalizedEmail },
        select: ['id'],
      });
      if (existingByEmail) {
        throw new ConflictException(
          'Email already exists. Sign in first and link the provider from settings.',
        );
      }
    }

    if (!user) {
      user = await this.createOAuthUser(
        provider,
        providerAccountId,
        normalizedEmail,
        dto.fullName,
      );
    }

    await this.upsertOAuthAccount(
      user.id,
      provider,
      providerAccountId,
      normalizedEmail,
    );
    return this.login(user);
  }

  async linkProvider(
    userId: number | undefined,
    providerRaw: string,
    dto: LinkProviderDto,
  ) {
    const validUserId = this.requireUserId(userId);
    const provider = this.normalizeProvider(providerRaw);
    const providerAccountId = dto.providerAccountId?.trim();
    if (!providerAccountId) {
      throw new BadRequestException('providerAccountId is required');
    }

    const user = await this.userRepository.findOne({
      where: { id: validUserId },
      relations: ['role', 'profile'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.upsertOAuthAccount(
      user.id,
      provider,
      providerAccountId,
      this.normalizeOptionalEmail(dto.email),
    );

    return {
      message: `Linked ${provider} successfully`,
    };
  }

  async unlinkProvider(userId: number | undefined, providerRaw: string) {
    const validUserId = this.requireUserId(userId);
    const provider = this.normalizeProvider(providerRaw);
    const user = await this.userRepository.findOne({
      where: { id: validUserId },
      relations: ['oauthAccounts'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const target = user.oauthAccounts?.find(
      (item) => item.provider === provider,
    );
    if (!target) {
      throw new NotFoundException('Provider is not linked');
    }

    const hasPassword = Boolean(
      user.password_hash && user.password_hash.trim().length > 0,
    );
    const linkedCount = user.oauthAccounts?.length ?? 0;
    if (!hasPassword && linkedCount <= 1) {
      throw new BadRequestException(
        'Set a password before unlinking the last provider.',
      );
    }

    await this.oauthAccountRepository.remove(target);
    return {
      message: `Unlinked ${provider}`,
    };
  }

  async getSecurityOverview(userId: number | undefined, req: Request) {
    const validUserId = this.requireUserId(userId);

    const user = await this.userRepository.findOne({
      where: { id: validUserId },
      relations: ['oauthAccounts'],
      select: ['id', 'password_hash', 'email'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hasPassword = Boolean(
      user.password_hash && user.password_hash.trim().length > 0,
    );
    const providers = SUPPORTED_OAUTH_PROVIDERS.map((provider) => {
      const linked = user.oauthAccounts?.find(
        (item) => item.provider === provider,
      );
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
        : (req.ip ?? req.socket.remoteAddress ?? null);

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

  async getSettings(userId: number | undefined) {
    const validUserId = this.requireUserId(userId);
    const user = await this.userRepository.findOne({
      where: { id: validUserId },
      relations: ['role', 'profile', 'settings'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profile = await this.ensureProfile(user);
    const settings = await this.ensureSettings(user);
    return this.buildSettingsResponse(user, profile, settings);
  }

  async updateSettingsPersonal(
    userId: number | undefined,
    dto: UpdateSettingsPersonalDto,
  ) {
    const validUserId = this.requireUserId(userId);
    const user = await this.userRepository.findOne({
      where: { id: validUserId },
      relations: ['role', 'profile', 'settings'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profile = await this.ensureProfile(user);
    const settings = await this.ensureSettings(user);

    if (dto.email !== undefined) {
      const normalizedEmail = dto.email.trim().toLowerCase();
      if (!normalizedEmail) {
        throw new BadRequestException('Email cannot be empty');
      }
      if (normalizedEmail !== user.email) {
        const existingByEmail = await this.userRepository.findOne({
          where: { email: normalizedEmail },
          select: ['id'],
        });
        if (existingByEmail) {
          throw new ConflictException('Email already exists');
        }
        user.email = normalizedEmail;
      }
    }

    if (dto.phoneNumber !== undefined) {
      const normalizedPhone = this.normalizeOptionalText(dto.phoneNumber);
      if (normalizedPhone && normalizedPhone !== profile.phone_number) {
        const existingByPhone = await this.profileRepository.findOne({
          where: {
            phone_number: normalizedPhone,
            userId: Not(validUserId),
          },
          select: ['userId'],
        });
        if (existingByPhone) {
          throw new ConflictException('Phone number already exists');
        }
      }
      profile.phone_number = normalizedPhone;
    }

    if (dto.legalName !== undefined) {
      profile.full_name = this.normalizeOptionalText(dto.legalName);
    }
    if (dto.preferredName !== undefined) {
      settings.preferred_name = this.normalizeOptionalText(dto.preferredName);
    }
    if (dto.residenceAddress !== undefined) {
      const residenceAddress = this.normalizeOptionalText(dto.residenceAddress);
      settings.residence_address = residenceAddress;
      profile.address = residenceAddress;
    }
    if (dto.mailingAddress !== undefined) {
      settings.mailing_address = this.normalizeOptionalText(dto.mailingAddress);
    }
    if (dto.emergencyName !== undefined) {
      settings.emergency_name = this.normalizeOptionalText(dto.emergencyName);
    }
    if (dto.emergencyRelationship !== undefined) {
      settings.emergency_relationship = this.normalizeOptionalText(
        dto.emergencyRelationship,
      );
    }
    if (dto.emergencyEmail !== undefined) {
      settings.emergency_email = this.normalizeOptionalEmail(
        dto.emergencyEmail,
      );
    }
    if (dto.emergencyPhone !== undefined) {
      settings.emergency_phone = this.normalizeOptionalText(dto.emergencyPhone);
    }

    await Promise.all([
      this.userRepository.save(user),
      this.profileRepository.save(profile),
      this.userSettingsRepository.save(settings),
    ]);

    return this.buildSettingsResponse(user, profile, settings);
  }

  async updateSettingsPreferences(
    userId: number | undefined,
    dto: UpdateSettingsPreferencesDto,
  ) {
    const validUserId = this.requireUserId(userId);
    const user = await this.userRepository.findOne({
      where: { id: validUserId },
      relations: ['settings'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const settings = await this.ensureSettings(user);

    if (dto.language !== undefined) {
      settings.language_code = dto.language.trim() || settings.language_code;
    }
    if (dto.currency !== undefined) {
      settings.currency_code =
        dto.currency.trim().toUpperCase() || settings.currency_code;
    }
    if (dto.timezone !== undefined) {
      settings.timezone = dto.timezone.trim() || settings.timezone;
    }

    if (dto.readReceiptsEnabled !== undefined) {
      settings.read_receipts_enabled = dto.readReceiptsEnabled;
    }
    if (dto.postPrivacySearchEngine !== undefined) {
      settings.post_privacy_search_engine = dto.postPrivacySearchEngine;
    }
    if (dto.postPrivacyHometown !== undefined) {
      settings.post_privacy_hometown = dto.postPrivacyHometown;
    }
    if (dto.postPrivacyExpertType !== undefined) {
      settings.post_privacy_expert_type = dto.postPrivacyExpertType;
    }
    if (dto.postPrivacyJoinedTime !== undefined) {
      settings.post_privacy_joined_time = dto.postPrivacyJoinedTime;
    }
    if (dto.postPrivacyBookedServices !== undefined) {
      settings.post_privacy_booked_services = dto.postPrivacyBookedServices;
    }
    if (dto.stopAllMarketingEmails !== undefined) {
      settings.stop_all_marketing_emails = dto.stopAllMarketingEmails;
    }

    if (dto.notifyOfferHostRecognition !== undefined) {
      settings.notify_offer_host_recognition = dto.notifyOfferHostRecognition;
    }
    if (dto.notifyOfferTripOffers !== undefined) {
      settings.notify_offer_trip_offers = dto.notifyOfferTripOffers;
    }
    if (dto.notifyOfferPriceSuggestions !== undefined) {
      settings.notify_offer_price_suggestions = dto.notifyOfferPriceSuggestions;
    }
    if (dto.notifyOfferHostPerks !== undefined) {
      settings.notify_offer_host_perks = dto.notifyOfferHostPerks;
    }
    if (dto.notifyOfferNewsAndPrograms !== undefined) {
      settings.notify_offer_news_and_programs = dto.notifyOfferNewsAndPrograms;
    }
    if (dto.notifyOfferLocalRegulations !== undefined) {
      settings.notify_offer_local_regulations = dto.notifyOfferLocalRegulations;
    }
    if (dto.notifyOfferInspirationAndDeals !== undefined) {
      settings.notify_offer_inspiration_and_deals =
        dto.notifyOfferInspirationAndDeals;
    }
    if (dto.notifyOfferTripPlanning !== undefined) {
      settings.notify_offer_trip_planning = dto.notifyOfferTripPlanning;
    }

    if (dto.notifyAccountNewDeviceLogin !== undefined) {
      settings.notify_account_new_device_login =
        dto.notifyAccountNewDeviceLogin;
    }
    if (dto.notifyAccountSecurityUpdates !== undefined) {
      settings.notify_account_security_updates =
        dto.notifyAccountSecurityUpdates;
    }
    if (dto.notifyAccountPaymentActivity !== undefined) {
      settings.notify_account_payment_activity =
        dto.notifyAccountPaymentActivity;
    }
    if (dto.notifyAccountProfileReminders !== undefined) {
      settings.notify_account_profile_reminders =
        dto.notifyAccountProfileReminders;
    }
    if (dto.notifyAccountVerificationReminders !== undefined) {
      settings.notify_account_verification_reminders =
        dto.notifyAccountVerificationReminders;
    }
    if (dto.notifyAccountSupportTips !== undefined) {
      settings.notify_account_support_tips = dto.notifyAccountSupportTips;
    }

    await this.userSettingsRepository.save(settings);

    return {
      message: 'Preferences updated successfully',
      preferences: this.buildPreferencesResponse(settings),
    };
  }

  async changePassword(userId: number | undefined, dto: ChangePasswordDto) {
    const validUserId = this.requireUserId(userId);
    const user = await this.userRepository.findOne({
      where: { id: validUserId },
      select: ['id', 'password_hash'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hasPassword = Boolean(
      user.password_hash && user.password_hash.trim().length > 0,
    );
    if (hasPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Vui lòng nhập mật khẩu hiện tại');
      }
      const isCurrentPasswordValid = await bcrypt.compare(
        dto.currentPassword,
        user.password_hash as string,
      );
      if (!isCurrentPasswordValid) {
        throw new BadRequestException('Mật khẩu hiện tại không đúng');
      }
    }

    if (dto.currentPassword && dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('Mật khẩu mới phải khác mật khẩu hiện tại');
    }

    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(dto.newPassword, salt);
    await this.userRepository.save(user);

    return {
      message: hasPassword
        ? 'Đổi mật khẩu thành công'
        : 'Tạo mật khẩu thành công',
    };
  }

  async deactivateAccount(
    userId: number | undefined,
    dto: DeactivateAccountDto,
  ) {
    const validUserId = this.requireUserId(userId);
    const user = await this.userRepository.findOne({
      where: { id: validUserId },
      select: ['id', 'password_hash', 'is_active'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hasPassword = Boolean(
      user.password_hash && user.password_hash.trim().length > 0,
    );

    if (hasPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Vui lÃ²ng nháº­p máº­t kháº©u hiá»‡n táº¡i');
      }

      const isCurrentPasswordValid = await bcrypt.compare(
        dto.currentPassword,
        user.password_hash as string,
      );
      if (!isCurrentPasswordValid) {
        throw new BadRequestException('Máº­t kháº©u hiá»‡n táº¡i khÃ´ng Ä‘Ãºng');
      }
    }

    if (user.is_active === false) {
      return {
        message: 'TÃ i khoáº£n Ä‘Ã£ Ä‘Æ°á»£c vÃ´ hiá»‡u hÃ³a trÆ°á»›c Ä‘Ã³',
      };
    }

    user.is_active = false;
    await this.userRepository.save(user);

    return {
      message: 'VÃ´ hiá»‡u hÃ³a tÃ i khoáº£n thÃ nh cÃ´ng',
    };
  }

  async getIdentityVerification(userId: number | undefined) {
    const validUserId = this.requireUserId(userId);
    const user = await this.userRepository.findOne({
      where: { id: validUserId },
      relations: ['settings'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const settings = await this.ensureSettings(user);
    return this.buildIdentityVerificationResponse(settings);
  }

  async submitIdentityVerification(
    userId: number | undefined,
    dto: SubmitIdentityVerificationDto,
  ) {
    const validUserId = this.requireUserId(userId);
    const user = await this.userRepository.findOne({
      where: { id: validUserId },
      relations: ['settings'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const documentType = this.normalizeIdentityDocumentType(dto.documentType);
    const frontImageName = this.normalizeIdentityDocumentReference(
      dto.frontImageName,
    );
    const backImageName = this.normalizeIdentityDocumentReference(
      dto.backImageName,
    );

    if (!frontImageName) {
      throw new BadRequestException('Vui lòng tải lên ảnh mặt trước');
    }
    if (documentType !== 'passport' && !backImageName) {
      throw new BadRequestException('Vui lòng tải lên ảnh mặt sau');
    }

    const settings = await this.ensureSettings(user);
    const now = new Date();
    settings.identity_document_type = documentType;
    settings.identity_front_image_name = frontImageName;
    settings.identity_back_image_name =
      documentType === 'passport' ? null : backImageName;
    settings.identity_verification_status = 'pending';
    settings.identity_submitted_at = now;
    settings.identity_verified_at = null;

    await this.userSettingsRepository.save(settings);

    return {
      message: 'Cập nhật xác minh danh tính thành công',
      verification: this.buildIdentityVerificationResponse(settings),
    };
  }

  async getProfile(userId: number | undefined) {
    const validUserId = this.requireUserId(userId);
    const user = await this.userRepository.findOne({
      where: { id: validUserId },
      relations: ['role', 'profile', 'settings'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profile = await this.ensureProfile(user);
    const settings = await this.ensureSettings(user);

    return this.buildProfileResponse(user, profile, settings);
  }

  async updateProfile(userId: number | undefined, dto: UpdateProfileDto) {
    const validUserId = this.requireUserId(userId);
    const user = await this.userRepository.findOne({
      where: { id: validUserId },
      relations: ['role', 'profile', 'settings'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profile = await this.ensureProfile(user);
    const settings = await this.ensureSettings(user);

    if (dto.phoneNumber !== undefined) {
      const normalizedPhone = this.normalizeOptionalText(dto.phoneNumber);
      if (normalizedPhone && normalizedPhone !== profile.phone_number) {
        const existingByPhone = await this.profileRepository.findOne({
          where: {
            phone_number: normalizedPhone,
            userId: Not(validUserId),
          },
          select: ['userId'],
        });
        if (existingByPhone) {
          throw new ConflictException('Phone number already exists');
        }
      }
      profile.phone_number = normalizedPhone;
    }

    if (dto.fullName !== undefined) {
      profile.full_name = this.normalizeOptionalText(dto.fullName);
    }
    if (dto.avatarUrl !== undefined) {
      profile.avatar_url = this.normalizeOptionalText(dto.avatarUrl);
    }
    if (dto.address !== undefined) {
      const normalizedAddress = this.normalizeOptionalText(dto.address);
      profile.address = normalizedAddress;
      settings.residence_address = normalizedAddress;
    }

    await Promise.all([
      this.profileRepository.save(profile),
      this.userSettingsRepository.save(settings),
    ]);

    return this.buildProfileResponse(user, profile, settings);
  }

  async getPublicProfile(userId: number) {
    if (!Number.isFinite(userId) || userId <= 0) {
      throw new BadRequestException('ID người dùng không hợp lệ');
    }

    const user = await this.userRepository.findOne({
      where: {
        id: userId,
        is_active: true,
      },
      relations: ['role', 'profile'],
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy hồ sơ người dùng');
    }

    const posts = await this.postRepository.find({
      where: {
        userId: user.id,
        status: 'approved',
      },
      relations: ['category', 'images', 'amenities'],
      order: {
        updatedAt: 'DESC',
        createdAt: 'DESC',
      },
    });

    return {
      userId: user.id,
      role: this.normalizeRoleName(user.role),
      full_name: user.profile?.full_name ?? user.username ?? user.email ?? null,
      avatar_url: user.profile?.avatar_url ?? null,
      address: user.profile?.address ?? null,
      joinedAt: user.createdAt,
      listingCount: posts.length,
      posts,
    };
  }

  private normalizeProvider(providerRaw: string): OAuthProvider {
    const provider = providerRaw?.trim().toLowerCase() as OAuthProvider;
    if (!SUPPORTED_OAUTH_PROVIDERS.includes(provider)) {
      throw new BadRequestException('Unsupported provider');
    }
    return provider;
  }

  private normalizeIdentityDocumentType(
    documentTypeRaw: string,
  ): IdentityDocumentType {
    const documentType = documentTypeRaw
      ?.trim()
      .toLowerCase() as IdentityDocumentType;
    if (!SUPPORTED_IDENTITY_DOCUMENT_TYPES.includes(documentType)) {
      throw new BadRequestException('Loại giấy tờ xác minh không được hỗ trợ');
    }
    return documentType;
  }

  private normalizeRoleName(
    role: RoleEntity | string | { name?: string | null } | null | undefined,
  ) {
    if (typeof role === 'string') {
      return role.toLowerCase();
    }
    const roleName = role?.name ?? 'student';
    return roleName.toLowerCase();
  }

  private assertOAuthBridgeSecret(secretFromHeader?: string) {
    const expectedSecret = this.configService
      .get<string>('OAUTH_BRIDGE_SECRET')
      ?.trim();
    if (!expectedSecret) {
      throw new InternalServerErrorException(
        'OAUTH_BRIDGE_SECRET is not configured',
      );
    }
    if (!secretFromHeader || secretFromHeader !== expectedSecret) {
      throw new UnauthorizedException('Invalid OAuth bridge secret');
    }
  }

  private requireUserId(userId?: number) {
    if (!userId) {
      throw new UnauthorizedException('Invalid login session');
    }
    return userId;
  }

  private normalizeOptionalText(value?: string | null) {
    if (value === undefined || value === null) return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private normalizeOptionalEmail(value?: string | null) {
    const normalized = this.normalizeOptionalText(value);
    return normalized ? normalized.toLowerCase() : null;
  }

  private async upsertOAuthAccount(
    userId: number,
    provider: OAuthProvider,
    providerAccountId: string,
    email?: string | null,
  ) {
    const existsByProviderAccount = await this.oauthAccountRepository.findOne({
      where: { provider, provider_account_id: providerAccountId },
    });
    if (existsByProviderAccount && existsByProviderAccount.user_id !== userId) {
      throw new ConflictException(
        'This OAuth account is already linked to another user',
      );
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
    email?: string | null,
    fullName?: string,
  ) {
    const role = await this.roleRepository.findOne({
      where: {
        name: In(['student', 'STUDENT']),
      },
    });
    if (!role) {
      throw new InternalServerErrorException(
        'Missing default role for OAuth user',
      );
    }

    const normalizedEmail =
      email?.trim().toLowerCase() ??
      `${provider}_${providerAccountId}@oauth.local`;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const username = await this.generateUniqueUsername(normalizedEmail);
      const user = this.userRepository.create({
        email: normalizedEmail,
        username,
        password_hash: null,
        role,
        is_active: true,
      });

      const profile = this.profileRepository.create({
        full_name: this.normalizeOptionalText(fullName) ?? username,
      });
      user.profile = profile;

      try {
        return await this.userRepository.save(user);
      } catch (error) {
        if (
          this.isUniqueConstraintViolation(error) &&
          this.getConstraintDetail(error).includes('(username)')
        ) {
          continue;
        }
        throw error;
      }
    }

    throw new InternalServerErrorException('Unable to create OAuth user');
  }

  private async generateUniqueUsername(source: string) {
    const localPart = source.split('@')[0] ?? 'user';
    const base =
      localPart
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, '')
        .replace(/^[._-]+|[._-]+$/g, '')
        .slice(0, 32) || 'user';

    for (let batch = 0; batch < 5; batch += 1) {
      const candidates = this.buildUsernameCandidates(base, 5);
      const existingUsers = await this.userRepository.find({
        where: { username: In(candidates) },
        select: ['username'],
      });
      const existingUsernames = new Set(
        existingUsers
          .map((user) => user.username)
          .filter((candidate): candidate is string => Boolean(candidate)),
      );

      const availableUsername = candidates.find(
        (candidate) => !existingUsernames.has(candidate),
      );
      if (availableUsername) {
        return availableUsername;
      }
    }

    throw new InternalServerErrorException('Unable to create unique username');
  }

  private async ensureProfile(user: UserEntity) {
    if (user.profile) return user.profile;

    const created = this.profileRepository.create({
      userId: user.id,
      full_name: null,
      phone_number: null,
      avatar_url: null,
      address: null,
    });
    created.user = user;
    const saved = await this.profileRepository.save(created);
    user.profile = saved;
    return saved;
  }

  private async ensureSettings(user: UserEntity) {
    if (user.settings) return user.settings;

    const created = this.userSettingsRepository.create({
      user_id: user.id,
    });
    created.user = user;
    const saved = await this.userSettingsRepository.save(created);
    user.settings = saved;
    return saved;
  }

  private buildPreferencesResponse(settings: UserSettingsEntity) {
    return {
      language: settings.language_code,
      currency: settings.currency_code,
      timezone: settings.timezone,
      privacy: {
        readReceiptsEnabled: settings.read_receipts_enabled,
        post: {
          searchEngine: settings.post_privacy_search_engine,
          hometown: settings.post_privacy_hometown,
          expertType: settings.post_privacy_expert_type,
          joinedTime: settings.post_privacy_joined_time,
          bookedServices: settings.post_privacy_booked_services,
        },
      },
      notifications: {
        stopAllMarketingEmails: settings.stop_all_marketing_emails,
        offers: {
          hostRecognition: settings.notify_offer_host_recognition,
          tripOffers: settings.notify_offer_trip_offers,
          priceSuggestions: settings.notify_offer_price_suggestions,
          hostPerks: settings.notify_offer_host_perks,
          newsAndPrograms: settings.notify_offer_news_and_programs,
          localRegulations: settings.notify_offer_local_regulations,
          inspirationAndDeals: settings.notify_offer_inspiration_and_deals,
          tripPlanning: settings.notify_offer_trip_planning,
        },
        account: {
          newDeviceLogin: settings.notify_account_new_device_login,
          securityUpdates: settings.notify_account_security_updates,
          paymentActivity: settings.notify_account_payment_activity,
          profileReminders: settings.notify_account_profile_reminders,
          verificationReminders: settings.notify_account_verification_reminders,
          supportTips: settings.notify_account_support_tips,
        },
      },
    };
  }

  private normalizeIdentityVerificationStatus(
    statusRaw?: string | null,
  ): IdentityVerificationStatus {
    if (
      statusRaw === 'pending' ||
      statusRaw === 'verified' ||
      statusRaw === 'rejected'
    ) {
      return statusRaw;
    }
    return 'unverified';
  }

  private normalizeIdentityDocumentReference(value?: string | null) {
    const normalizedValue = this.normalizeOptionalText(value);
    if (!normalizedValue) {
      return null;
    }

    if (/^https?:\/\//i.test(normalizedValue)) {
      return normalizedValue;
    }

    const normalizedPath = normalizedValue
      .replace(/\\/g, '/')
      .replace(/^\/+/, '');
    const pathSegments = normalizedPath.split('/').filter(Boolean);
    if (
      pathSegments.length === 0 ||
      pathSegments.some((segment) => segment === '.' || segment === '..')
    ) {
      throw new BadRequestException(
        'Tham chieu tep xac minh danh tinh khong hop le',
      );
    }

    return pathSegments.join('/');
  }

  private buildIdentityVerificationResponse(settings: UserSettingsEntity) {
    const status = this.normalizeIdentityVerificationStatus(
      settings.identity_verification_status,
    );

    return {
      status,
      isVerified: status === 'verified',
      documentType: settings.identity_document_type ?? null,
      frontImageName: settings.identity_front_image_name ?? null,
      backImageName: settings.identity_back_image_name ?? null,
      submittedAt: settings.identity_submitted_at?.toISOString() ?? null,
      verifiedAt: settings.identity_verified_at?.toISOString() ?? null,
    };
  }

  private buildSettingsResponse(
    user: UserEntity,
    profile: UserProfileEntity,
    settings: UserSettingsEntity,
  ) {
    return {
      personal: {
        legalName: profile.full_name ?? '',
        preferredName: settings.preferred_name ?? '',
        email: user.email ?? '',
        phoneNumber: profile.phone_number ?? '',
        residenceAddress: settings.residence_address ?? profile.address ?? '',
        mailingAddress: settings.mailing_address ?? '',
        emergencyContact: {
          name: settings.emergency_name ?? '',
          relationship: settings.emergency_relationship ?? '',
          email: settings.emergency_email ?? '',
          phone: settings.emergency_phone ?? '',
        },
      },
      preferences: this.buildPreferencesResponse(settings),
      account: {
        role: this.normalizeRoleName(user.role),
      },
      identity: this.buildIdentityVerificationResponse(settings),
    };
  }

  private buildProfileResponse(
    user: UserEntity,
    profile: UserProfileEntity,
    settings: UserSettingsEntity,
  ) {
    return {
      userId: user.id,
      email: user.email,
      role: this.normalizeRoleName(user.role),
      full_name: profile.full_name ?? null,
      phone_number: profile.phone_number ?? null,
      avatar_url: profile.avatar_url ?? null,
      address: settings.residence_address || profile.address || null,
      preferred_name: settings.preferred_name ?? null,
      mailing_address: settings.mailing_address ?? null,
      emergency_name: settings.emergency_name ?? null,
      emergency_relationship: settings.emergency_relationship ?? null,
      emergency_email: settings.emergency_email ?? null,
      emergency_phone: settings.emergency_phone ?? null,
    };
  }

  private buildRegisteredUserResponse(savedUser: UserEntity) {
    return {
      id: savedUser.id,
      email: savedUser.email,
      username: savedUser.username,
      is_active: savedUser.is_active,
      created_at: savedUser.createdAt,
      role: {
        id: savedUser.role?.id,
        name: savedUser.role?.name,
      },
      profile: {
        full_name: savedUser.profile?.full_name,
        phone_number: savedUser.profile?.phone_number,
        avatar_url: savedUser.profile?.avatar_url,
        address: savedUser.profile?.address,
      },
    };
  }

  private isUniqueConstraintViolation(error: unknown) {
    return this.getDatabaseErrorCode(error) === '23505';
  }

  private getDatabaseErrorCode(error: unknown) {
    const candidate = error as {
      code?: string;
      driverError?: { code?: string };
    };
    return candidate?.driverError?.code ?? candidate?.code ?? null;
  }

  private getConstraintDetail(error: unknown) {
    const candidate = error as {
      detail?: string;
      driverError?: { detail?: string };
    };
    return candidate?.driverError?.detail ?? candidate?.detail ?? '';
  }

  private buildRegistrationConflictException(error: unknown) {
    const detail = this.getConstraintDetail(error);
    if (detail.includes('(email)')) {
      return new ConflictException('Email already exists');
    }
    if (detail.includes('(username)')) {
      return new ConflictException('Username already exists');
    }
    if (detail.includes('(phone_number)')) {
      return new ConflictException('Phone number already exists');
    }
    return new ConflictException('Registration data already exists');
  }

  private buildUsernameCandidates(base: string, count: number) {
    const candidates = new Set<string>();
    while (candidates.size < count) {
      const suffix = Math.floor(1000 + Math.random() * 9000);
      candidates.add(`${base}${suffix}`);
    }
    return Array.from(candidates);
  }
}
