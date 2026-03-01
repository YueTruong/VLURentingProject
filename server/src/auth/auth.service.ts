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
import { RegisterDto } from './dto/register.dto';
import { OauthLoginDto } from './dto/oauth-login.dto';
import { LinkProviderDto } from './dto/link-provider.dto';
import { UpdateSettingsPersonalDto } from './dto/update-settings-personal.dto';
import { UpdateSettingsPreferencesDto } from './dto/update-settings-preferences.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SubmitIdentityVerificationDto } from './dto/submit-identity-verification.dto';

const SUPPORTED_OAUTH_PROVIDERS = ['google', 'facebook', 'apple'] as const;
type OAuthProvider = (typeof SUPPORTED_OAUTH_PROVIDERS)[number];
const SUPPORTED_IDENTITY_DOCUMENT_TYPES = [
  'driver-license',
  'passport',
  'national-id',
] as const;
type IdentityDocumentType = (typeof SUPPORTED_IDENTITY_DOCUMENT_TYPES)[number];
type IdentityVerificationStatus = 'unverified' | 'pending' | 'verified';

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
    const normalizedPhone = phoneNumber.trim();

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
      where: { username },
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
    newUser.username = username;
    newUser.password_hash = hashedPassword;
    newUser.role = userRole;

    const newProfile = new UserProfileEntity();
    newProfile.full_name = fullName.trim();
    newProfile.phone_number = normalizedPhone;
    newProfile.user = newUser;
    newUser.profile = newProfile;

    try {
      const savedUser = await this.userRepository.save(newUser);
      const { password_hash, ...safeUser } = savedUser;
      void password_hash;
      return safeUser;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Registration failed');
    }
  }

  async validateUser(identifier: string, pass: string): Promise<any> {
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

    const result = { ...user };
    delete result.password_hash;
    delete result.is_active;
    return result;
  }

  async login(user: any) {
    const roleName = this.normalizeRoleName(user.role);
    const fullName =
      user.profile?.full_name ?? user.full_name ?? user.name ?? null;

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
    const normalizedEmail = this.normalizeOptionalEmail(dto.email);

    let oauthAccount = await this.oauthAccountRepository.findOne({
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
    const frontImageName = this.normalizeOptionalText(dto.frontImageName);
    const backImageName = this.normalizeOptionalText(dto.backImageName);

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
    settings.identity_verification_status = 'verified';
    settings.identity_submitted_at = now;
    settings.identity_verified_at = now;

    await this.userSettingsRepository.save(settings);

    return {
      message: 'Cập nhật xác minh danh tính thành công',
      verification: this.buildIdentityVerificationResponse(settings),
    };
  }

  async getProfile(userId: number | undefined) {
    const settingsData = await this.getSettings(userId);
    return {
      email: settingsData.personal.email,
      role: settingsData.account.role,
      full_name: settingsData.personal.legalName || null,
      phone_number: settingsData.personal.phoneNumber || null,
      address: settingsData.personal.residenceAddress || null,
      preferred_name: settingsData.personal.preferredName || null,
      mailing_address: settingsData.personal.mailingAddress || null,
      emergency_name: settingsData.personal.emergencyContact.name || null,
      emergency_relationship:
        settingsData.personal.emergencyContact.relationship || null,
      emergency_email: settingsData.personal.emergencyContact.email || null,
      emergency_phone: settingsData.personal.emergencyContact.phone || null,
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

  private normalizeRoleName(role: RoleEntity | string | null | undefined) {
    if (typeof role === 'string') {
      return role.toLowerCase();
    }
    const roleName = role?.name ?? 'student';
    return roleName.toLowerCase();
  }

  private assertOAuthBridgeSecret(secretFromHeader?: string) {
    const expectedSecret = this.configService.get<string>(
      'OAUTH_BRIDGE_SECRET',
    );
    if (!expectedSecret) return;
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

    return this.userRepository.save(user);
  }

  private async generateUniqueUsername(source: string) {
    const localPart = source.split('@')[0] ?? 'user';
    const base =
      localPart
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
    if (statusRaw === 'pending' || statusRaw === 'verified') {
      return statusRaw;
    }
    return 'unverified';
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
}
