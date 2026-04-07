import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { v2 as cloudinary } from 'cloudinary';
import { constants as fsConstants } from 'fs';
import { access, readdir } from 'fs/promises';
import { basename, extname, resolve, sep } from 'path';
import { FindManyOptions, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { AmenityEntity } from 'src/database/entities/amenity.entity';
import { BookingEntity } from 'src/database/entities/booking.entity';
import { CategoryEntity } from 'src/database/entities/category.entity';
import { PostEntity } from 'src/database/entities/post.entity';
import { ReviewEntity } from 'src/database/entities/review.entity';
import { UserSettingsEntity } from 'src/database/entities/user-settings.entity';
import { UserEntity } from 'src/database/entities/user.entity';
import { ManageAmenityDto } from './dto/manage-amenity.dto';
import { ManageCategoryDto } from './dto/manage-category.dto';
import { ReviewIdentityVerificationDto } from './dto/review-identity-verification.dto';
import { UpdatePostStatusDto } from './dto/update-post-status.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

type IdentityVerificationDocumentSource =
  | { kind: 'file'; path: string }
  | { kind: 'url'; url: string };

type DashboardTrendRange = '7d' | '30d';

type DashboardTrendPoint = {
  label: string;
  value: number;
};

type DashboardKpiCard = {
  id: string;
  label: string;
  value: string;
  hint?: string;
  delta?: { value: string; trend: 'up' | 'down' };
};

type DashboardActivityStatus = 'success' | 'failed';

type DashboardActivityLog = {
  id: string;
  time: string;
  user: string;
  action: string;
  status: DashboardActivityStatus;
  channel: 'web' | 'api';
  details?: string;
};

type DashboardUserStatus = 'ACTIVE' | 'BLOCKED' | 'PENDING';

type DashboardUserRow = {
  id: string;
  username: string;
  email: string;
  role: string;
  status: DashboardUserStatus;
  verified: boolean;
  createdAt: string;
};

type DashboardListingStatus =
  | 'APPROVED'
  | 'PENDING'
  | 'REJECTED'
  | 'HIDDEN'
  | 'RENTED';

type DashboardListingRow = {
  id: string;
  title: string;
  owner: string;
  city: string;
  price: number;
  status: DashboardListingStatus;
  createdAt: string;
};

type DashboardBarPoint = {
  label: string;
  value: number;
};

type DashboardOverview = {
  generatedAt: string;
  kpiCards: DashboardKpiCard[];
  trendSeries: {
    users: Record<DashboardTrendRange, DashboardTrendPoint[]>;
    listings: Record<DashboardTrendRange, DashboardTrendPoint[]>;
  };
  activities: DashboardActivityLog[];
  users: DashboardUserRow[];
  listings: DashboardListingRow[];
  userRoleBreakdown: DashboardBarPoint[];
  listingStatusBreakdown: DashboardBarPoint[];
};

@Injectable()
export class AdminService {
  private readonly uploadsDirectory = resolve(__dirname, '..', '..', 'uploads');
  private readonly cloudinaryFolder = 'vlu-renting';

  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserSettingsEntity)
    private readonly userSettingsRepository: Repository<UserSettingsEntity>,
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
    @InjectRepository(ReviewEntity)
    private readonly reviewRepository: Repository<ReviewEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    @InjectRepository(AmenityEntity)
    private readonly amenityRepository: Repository<AmenityEntity>,
    private readonly configService: ConfigService,
  ) {}

  private sanitizeUser(user: UserEntity | null) {
    if (!user) {
      return null;
    }

    const { password_hash, ...safeUser } = user;
    return safeUser;
  }

  async getDashboardOverview(): Promise<DashboardOverview> {
    const now = new Date();
    const sixtyDaysAgo = this.shiftDays(now, -60);

    const [users, posts, bookings, reviews] = await Promise.all([
      this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.role', 'role')
        .leftJoinAndSelect('user.profile', 'profile')
        .leftJoinAndSelect('user.settings', 'settings')
        .where('LOWER(role.name) <> :adminRole', { adminRole: 'admin' })
        .orderBy('user.createdAt', 'DESC')
        .getMany(),
      this.postRepository.find({
        relations: ['user', 'user.profile'],
        order: {
          createdAt: 'DESC',
        },
      }),
      this.bookingRepository.find({
        relations: ['post', 'student', 'student.profile'],
        where: {
          createdAt: MoreThanOrEqual(sixtyDaysAgo),
        },
        order: {
          createdAt: 'DESC',
        },
      }),
      this.reviewRepository.find({
        relations: ['user', 'user.profile', 'post'],
        order: {
          createdAt: 'DESC',
        },
        take: 24,
      }),
    ]);

    const recentBookings = bookings;
    const usersRows = users.map((user) => this.mapUserToDashboardRow(user));
    const listingRows = posts.map((post) => this.mapPostToDashboardRow(post));

    const newUsersCurrentWindow = users.filter((user) =>
      this.isOnOrAfter(user.createdAt, this.shiftDays(now, -7)),
    ).length;
    const newUsersPreviousWindow = users.filter((user) =>
      this.isWithinRange(
        user.createdAt,
        this.shiftDays(now, -14),
        this.shiftDays(now, -8),
      ),
    ).length;

    const bookingApprovalCurrent = this.calculateBookingApprovalRate(
      recentBookings,
      this.shiftDays(now, -30),
      now,
    );
    const bookingApprovalPrevious = this.calculateBookingApprovalRate(
      recentBookings,
      this.shiftDays(now, -60),
      this.shiftDays(now, -31),
    );

    const kpiCards: DashboardKpiCard[] = [
      {
        id: 'total-users',
        label: 'Total Users',
        value: this.formatInteger(users.length),
        hint: 'Non-admin accounts',
      },
      {
        id: 'new-users',
        label: 'New Users (7d)',
        value: this.formatInteger(newUsersCurrentWindow),
        hint: 'Compared with previous 7 days',
        delta: this.buildPercentageDelta(
          newUsersCurrentWindow,
          newUsersPreviousWindow,
        ),
      },
      {
        id: 'total-listings',
        label: 'Total Listings',
        value: this.formatInteger(posts.length),
        hint: 'All listings in the system',
      },
      {
        id: 'approved-listings',
        label: 'Approved Listings',
        value: this.formatInteger(
          posts.filter((post) => post.status === 'approved').length,
        ),
        hint: 'Currently approved',
      },
      {
        id: 'pending-listings',
        label: 'Pending Listings',
        value: this.formatInteger(
          posts.filter((post) => post.status === 'pending').length,
        ),
        hint: 'Awaiting moderation',
      },
      {
        id: 'booking-approval-rate',
        label: 'Booking Approval Rate',
        value: `${Math.round(bookingApprovalCurrent * 100)}%`,
        hint: 'Last 30 days',
        delta: this.buildPointDelta(
          bookingApprovalCurrent,
          bookingApprovalPrevious,
        ),
      },
    ];

    return {
      generatedAt: now.toISOString(),
      kpiCards,
      trendSeries: {
        users: {
          '7d': this.buildDailyTrend(users.map((user) => user.createdAt), now, 7),
          '30d': this.buildWeeklyTrend(users.map((user) => user.createdAt), now),
        },
        listings: {
          '7d': this.buildDailyTrend(
            posts.map((post) => post.createdAt),
            now,
            7,
          ),
          '30d': this.buildWeeklyTrend(posts.map((post) => post.createdAt), now),
        },
      },
      activities: this.buildActivityFeed(users, posts, recentBookings, reviews),
      users: usersRows,
      listings: listingRows,
      userRoleBreakdown: this.buildUserRoleBreakdown(usersRows),
      listingStatusBreakdown: this.buildListingStatusBreakdown(listingRows),
    };
  }

  private buildActivityFeed(
    users: UserEntity[],
    posts: PostEntity[],
    bookings: BookingEntity[],
    reviews: ReviewEntity[],
  ): DashboardActivityLog[] {
    const identityActivities = users
      .filter((user) => user.settings?.identity_submitted_at)
      .map((user) => ({
        id: `identity-${user.id}`,
        time: user.settings?.identity_submitted_at?.toISOString() ?? '',
        user: this.getUserDisplayName(user),
        action: 'Submitted identity verification',
        status:
          user.settings?.identity_verification_status === 'rejected'
            ? ('failed' as const)
            : ('success' as const),
        channel: 'web' as const,
        details: user.settings?.identity_document_type
          ? `Document: ${user.settings.identity_document_type}`
          : undefined,
      }));

    const userActivities = users.map((user) => ({
      id: `user-${user.id}`,
      time: user.createdAt.toISOString(),
      user: this.getUserDisplayName(user),
      action: 'Created account',
      status: 'success' as const,
      channel: 'web' as const,
      details: user.role?.name ? `Role: ${user.role.name.toUpperCase()}` : undefined,
    }));

    const postActivities = posts.map((post) => ({
      id: `post-${post.id}`,
      time: post.createdAt.toISOString(),
      user: this.getUserDisplayName(post.user),
      action: `Created listing #${post.id}`,
      status: 'success' as const,
      channel: 'web' as const,
      details: post.title || post.address || undefined,
    }));

    const bookingActivities = bookings.map((booking) => {
      const normalizedStatus = booking.status?.trim().toLowerCase();
      const isFailed =
        normalizedStatus === 'rejected' || normalizedStatus === 'cancelled';

      return {
        id: `booking-${booking.id}`,
        time: booking.createdAt.toISOString(),
        user: this.getUserDisplayName(booking.student),
        action:
          normalizedStatus === 'approved'
            ? `Approved booking #${booking.id}`
            : normalizedStatus === 'rejected'
              ? `Rejected booking #${booking.id}`
              : normalizedStatus === 'cancelled'
                ? `Cancelled booking #${booking.id}`
                : `Created booking #${booking.id}`,
        status: isFailed ? ('failed' as const) : ('success' as const),
        channel: 'web' as const,
        details:
          booking.post?.title || booking.booking_date
            ? [booking.post?.title, booking.booking_date, booking.time_slot]
                .filter(Boolean)
                .join(' • ')
            : undefined,
      };
    });

    const reviewActivities = reviews.map((review) => ({
      id: `review-${review.id}`,
      time: review.createdAt.toISOString(),
      user: this.getUserDisplayName(review.user),
      action: `Posted review${review.postId ? ` for listing #${review.postId}` : ''}`,
      status: 'success' as const,
      channel: 'web' as const,
      details:
        typeof review.rating === 'number'
          ? `${review.rating}/5 stars`
          : undefined,
    }));

    return [
      ...identityActivities,
      ...userActivities,
      ...postActivities,
      ...bookingActivities,
      ...reviewActivities,
    ]
      .filter((item) => Boolean(item.time))
      .sort(
        (left, right) =>
          new Date(right.time).getTime() - new Date(left.time).getTime(),
      )
      .slice(0, 24);
  }

  private mapUserToDashboardRow(user: UserEntity): DashboardUserRow {
    const role = user.role?.name?.trim().toUpperCase() || 'UNKNOWN';
    const username =
      user.profile?.full_name?.trim() ||
      user.username?.trim() ||
      user.email?.trim() ||
      `User #${user.id}`;

    return {
      id: String(user.id),
      username,
      email: user.email?.trim() || '-',
      role,
      status: this.mapUserStatus(user),
      verified: user.settings?.identity_verification_status === 'verified',
      createdAt: user.createdAt.toISOString(),
    };
  }

  private mapPostToDashboardRow(post: PostEntity): DashboardListingRow {
    return {
      id: String(post.id),
      title: post.title?.trim() || `Listing #${post.id}`,
      owner: this.getUserDisplayName(post.user),
      city: this.extractListingCity(post.address),
      price: this.toNumberValue(post.price),
      status: this.mapListingStatus(post.status),
      createdAt: post.createdAt.toISOString(),
    };
  }

  private buildUserRoleBreakdown(
    users: DashboardUserRow[],
  ): DashboardBarPoint[] {
    const counts = new Map<string, number>();

    for (const user of users) {
      counts.set(user.role, (counts.get(user.role) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((left, right) => right.value - left.value);
  }

  private buildListingStatusBreakdown(
    listings: DashboardListingRow[],
  ): DashboardBarPoint[] {
    const counts = new Map<DashboardListingStatus, number>();

    for (const listing of listings) {
      counts.set(listing.status, (counts.get(listing.status) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((left, right) => right.value - left.value);
  }

  private buildDailyTrend(
    timestamps: Array<Date | null | undefined>,
    now: Date,
    days: number,
  ): DashboardTrendPoint[] {
    const formatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
    const buckets = Array.from({ length: days }, (_, index) => {
      const date = this.startOfDay(this.shiftDays(now, index - (days - 1)));
      return {
        label: formatter.format(date),
        date,
        value: 0,
      };
    });

    for (const timestamp of timestamps) {
      if (!timestamp) {
        continue;
      }

      const normalized = this.startOfDay(timestamp).getTime();
      const bucket = buckets.find((item) => item.date.getTime() === normalized);
      if (bucket) {
        bucket.value += 1;
      }
    }

    return buckets.map(({ label, value }) => ({ label, value }));
  }

  private buildWeeklyTrend(
    timestamps: Array<Date | null | undefined>,
    now: Date,
  ): DashboardTrendPoint[] {
    const buckets = Array.from({ length: 4 }, (_, index) => {
      const bucketIndex = 3 - index;
      const end = this.endOfDay(this.shiftDays(now, -bucketIndex * 7));
      const start = this.startOfDay(this.shiftDays(end, -6));

      return {
        label: `W${index + 1}`,
        start,
        end,
        value: 0,
      };
    });

    for (const timestamp of timestamps) {
      if (!timestamp) {
        continue;
      }

      const bucket = buckets.find((item) =>
        this.isWithinRange(timestamp, item.start, item.end),
      );
      if (bucket) {
        bucket.value += 1;
      }
    }

    return buckets.map(({ label, value }) => ({ label, value }));
  }

  private calculateBookingApprovalRate(
    bookings: BookingEntity[],
    from: Date,
    to: Date,
  ) {
    const scoped = bookings.filter((booking) =>
      this.isWithinRange(booking.createdAt, from, to),
    );
    const resolved = scoped.filter((booking) => {
      const normalizedStatus = booking.status?.trim().toLowerCase();
      return normalizedStatus === 'approved' || normalizedStatus === 'rejected';
    });

    if (resolved.length === 0) {
      return 0;
    }

    const approved = resolved.filter(
      (booking) => booking.status?.trim().toLowerCase() === 'approved',
    ).length;
    return approved / resolved.length;
  }

  private buildPercentageDelta(current: number, previous: number) {
    if (current === 0 && previous === 0) {
      return undefined;
    }

    if (previous === 0) {
      return { value: '+100%', trend: 'up' as const };
    }

    const percentageChange = ((current - previous) / previous) * 100;
    const absoluteChange = Math.abs(percentageChange);
    const formatted =
      absoluteChange >= 10 || Number.isInteger(absoluteChange)
        ? absoluteChange.toFixed(0)
        : absoluteChange.toFixed(1);

    return {
      value: `${percentageChange >= 0 ? '+' : '-'}${formatted}%`,
      trend: percentageChange >= 0 ? ('up' as const) : ('down' as const),
    };
  }

  private buildPointDelta(current: number, previous: number) {
    const diff = (current - previous) * 100;
    if (diff === 0) {
      return undefined;
    }

    const absoluteDiff = Math.abs(diff);
    const formatted =
      absoluteDiff >= 10 || Number.isInteger(absoluteDiff)
        ? absoluteDiff.toFixed(0)
        : absoluteDiff.toFixed(1);

    return {
      value: `${diff >= 0 ? '+' : '-'}${formatted} pts`,
      trend: diff >= 0 ? ('up' as const) : ('down' as const),
    };
  }

  private mapUserStatus(user: UserEntity): DashboardUserStatus {
    if (!user.is_active) {
      return 'BLOCKED';
    }

    if (user.settings?.identity_verification_status === 'pending') {
      return 'PENDING';
    }

    return 'ACTIVE';
  }

  private mapListingStatus(status?: string | null): DashboardListingStatus {
    const normalized = status?.trim().toLowerCase();

    if (normalized === 'approved') return 'APPROVED';
    if (normalized === 'rejected') return 'REJECTED';
    if (normalized === 'hidden') return 'HIDDEN';
    if (normalized === 'rented') return 'RENTED';
    return 'PENDING';
  }

  private getUserDisplayName(user?: UserEntity | null) {
    if (!user) {
      return 'Unknown user';
    }

    return (
      user.profile?.full_name?.trim() ||
      user.username?.trim() ||
      user.email?.trim() ||
      `User #${user.id}`
    );
  }

  private extractListingCity(address?: string | null) {
    const normalized = address?.trim();
    if (!normalized) {
      return '-';
    }

    const segments = normalized
      .split(',')
      .map((segment) => segment.trim())
      .filter(Boolean)
      .filter((segment) => !/^viet nam$/i.test(segment));

    if (segments.length >= 2) {
      return segments.slice(-2).join(', ');
    }

    return segments[0] ?? normalized;
  }

  private formatInteger(value: number) {
    return value.toLocaleString('vi-VN');
  }

  private toNumberValue(value: number | string | null | undefined) {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  }

  private shiftDays(baseDate: Date, offset: number) {
    const nextDate = new Date(baseDate);
    nextDate.setDate(nextDate.getDate() + offset);
    return nextDate;
  }

  private startOfDay(date: Date) {
    const nextDate = new Date(date);
    nextDate.setHours(0, 0, 0, 0);
    return nextDate;
  }

  private endOfDay(date: Date) {
    const nextDate = new Date(date);
    nextDate.setHours(23, 59, 59, 999);
    return nextDate;
  }

  private isOnOrAfter(value: Date, threshold: Date) {
    return value.getTime() >= threshold.getTime();
  }

  private isWithinRange(value: Date, start: Date, end: Date) {
    const timestamp = value.getTime();
    return timestamp >= start.getTime() && timestamp <= end.getTime();
  }

  async getAllPosts(status?: string) {
    const options: FindManyOptions<PostEntity> = {
      order: { createdAt: 'DESC' },
      relations: ['user', 'user.profile', 'category', 'images', 'amenities'],
    };

    if (status) {
      options.where = { status: status as PostEntity['status'] };
    }

    const posts = await this.postRepository.find(options);
    return posts.map((post) => ({
      ...post,
      user: this.sanitizeUser(post.user),
    }));
  }

  async updatePostStatus(id: number, updatePostStatusDto: UpdatePostStatusDto) {
    const post = await this.postRepository.findOneBy({ id });
    if (!post) {
      throw new NotFoundException('Khong tim thay tin dang');
    }

    const nextStatus = updatePostStatusDto.status;
    const rejectionReason = updatePostStatusDto.rejectionReason?.trim();

    if (nextStatus === 'rejected') {
      if (!rejectionReason) {
        throw new BadRequestException('Vui long nhap ly do tu choi');
      }
      post.rejectionReason = rejectionReason;
      post.resubmittedAt = null;
    } else {
      post.rejectionReason = null;
      post.resubmittedAt = null;
    }

    post.status = nextStatus;
    return this.postRepository.save(post);
  }

  async getAllUsers() {
    const users = await this.userRepository.find({
      relations: ['role', 'profile'],
      where: {
        role: {
          name: Not('admin'),
        },
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return users.map((user) => this.sanitizeUser(user));
  }

  async getIdentityVerifications(status?: string) {
    const query = this.userSettingsRepository
      .createQueryBuilder('settings')
      .leftJoinAndSelect('settings.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.role', 'role')
      .where('settings.identity_document_type IS NOT NULL');

    if (status && ['pending', 'verified', 'rejected'].includes(status)) {
      query.andWhere('settings.identity_verification_status = :status', {
        status,
      });
    } else {
      query.andWhere('settings.identity_verification_status <> :status', {
        status: 'unverified',
      });
    }

    const submissions = await query
      .orderBy('settings.identity_submitted_at', 'DESC')
      .getMany();

    return submissions.map((settings) => ({
      userId: settings.user_id,
      status: settings.identity_verification_status,
      documentType: settings.identity_document_type,
      frontImageName: settings.identity_front_image_name,
      backImageName: settings.identity_back_image_name,
      submittedAt: settings.identity_submitted_at,
      verifiedAt: settings.identity_verified_at,
      user: this.sanitizeUser(settings.user),
    }));
  }

  async resolveIdentityVerificationDocumentSource(
    referenceRaw: string,
  ): Promise<IdentityVerificationDocumentSource> {
    const reference = this.normalizeIdentityDocumentReference(referenceRaw);
    if (this.isHttpUrl(reference)) {
      return { kind: 'url', url: reference };
    }

    const localFilePath =
      await this.resolveLocalIdentityDocumentPath(reference);
    if (localFilePath) {
      return { kind: 'file', path: localFilePath };
    }

    const cloudinaryUrl =
      await this.resolveCloudinaryIdentityDocumentUrl(reference);
    if (cloudinaryUrl) {
      return { kind: 'url', url: cloudinaryUrl };
    }

    throw new NotFoundException('Khong tim thay tep xac minh danh tinh');
  }

  async reviewIdentityVerification(
    userId: number,
    payload: ReviewIdentityVerificationDto,
  ) {
    const settings = await this.userSettingsRepository.findOne({
      where: { user_id: userId },
      relations: ['user', 'user.profile', 'user.role'],
    });

    if (!settings || !settings.identity_document_type) {
      throw new NotFoundException('Khong tim thay ho so xac minh danh tinh');
    }

    settings.identity_verification_status = payload.status;
    settings.identity_verified_at =
      payload.status === 'verified' ? new Date() : null;

    const saved = await this.userSettingsRepository.save(settings);

    return {
      userId: saved.user_id,
      status: saved.identity_verification_status,
      documentType: saved.identity_document_type,
      frontImageName: saved.identity_front_image_name,
      backImageName: saved.identity_back_image_name,
      submittedAt: saved.identity_submitted_at,
      verifiedAt: saved.identity_verified_at,
      user: this.sanitizeUser(saved.user),
    };
  }

  private normalizeIdentityDocumentReference(referenceRaw?: string | null) {
    const reference = referenceRaw?.trim();
    if (!reference) {
      throw new BadRequestException('Thieu tham chieu tep xac minh danh tinh');
    }

    if (this.isHttpUrl(reference)) {
      return reference;
    }

    const normalizedReference = reference
      .replace(/\\/g, '/')
      .replace(/^\/+/, '');
    const withoutUploadsPrefix = normalizedReference.startsWith('uploads/')
      ? normalizedReference.slice('uploads/'.length)
      : normalizedReference;
    const segments = withoutUploadsPrefix.split('/').filter(Boolean);

    if (
      segments.length === 0 ||
      segments.some((segment) => segment === '.' || segment === '..')
    ) {
      throw new BadRequestException(
        'Tham chieu tep xac minh danh tinh khong hop le',
      );
    }

    return segments.join('/');
  }

  private isHttpUrl(reference: string) {
    try {
      const parsed = new URL(reference);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private async resolveLocalIdentityDocumentPath(reference: string) {
    const directPath = resolve(this.uploadsDirectory, reference);
    if (!this.isWithinUploadsDirectory(directPath)) {
      throw new BadRequestException(
        'Tham chieu tep xac minh danh tinh khong hop le',
      );
    }

    if (await this.isReadableFile(directPath)) {
      return directPath;
    }

    return this.findUploadFileByName(basename(reference));
  }

  private isWithinUploadsDirectory(candidatePath: string) {
    const uploadsDirectoryPrefix = `${this.uploadsDirectory}${sep}`;
    return (
      candidatePath === this.uploadsDirectory ||
      candidatePath.startsWith(uploadsDirectoryPrefix)
    );
  }

  private async isReadableFile(filePath: string) {
    try {
      await access(filePath, fsConstants.R_OK);
      return true;
    } catch {
      return false;
    }
  }

  private async findUploadFileByName(fileName: string, directory?: string) {
    if (!fileName) {
      return null;
    }

    const currentDirectory = directory ?? this.uploadsDirectory;
    let entries;
    try {
      entries = await readdir(currentDirectory, { withFileTypes: true });
    } catch {
      return null;
    }

    for (const entry of entries) {
      const entryPath = resolve(currentDirectory, entry.name);
      if (entry.isFile() && entry.name === fileName) {
        return entryPath;
      }

      if (entry.isDirectory()) {
        const nestedPath = await this.findUploadFileByName(fileName, entryPath);
        if (nestedPath) {
          return nestedPath;
        }
      }
    }

    return null;
  }

  private async resolveCloudinaryIdentityDocumentUrl(reference: string) {
    const cloudName = this.configService.get<string>('CLOUDINARY_NAME')?.trim();
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY')?.trim();
    const apiSecret = this.configService
      .get<string>('CLOUDINARY_API_SECRET')
      ?.trim();

    if (!cloudName || !apiKey || !apiSecret) {
      return null;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    const fileName = basename(reference);
    const baseName = fileName
      ? fileName.slice(0, fileName.length - extname(fileName).length)
      : reference;
    const publicIdCandidates = Array.from(
      new Set(
        [
          reference,
          baseName,
          `${this.cloudinaryFolder}/${reference}`,
          `${this.cloudinaryFolder}/${baseName}`,
          fileName ? `${this.cloudinaryFolder}/${fileName}` : null,
        ].filter((candidate): candidate is string => Boolean(candidate)),
      ),
    );
    const filenameCandidates = Array.from(
      new Set(
        [fileName, baseName].filter((candidate): candidate is string =>
          Boolean(candidate),
        ),
      ),
    );
    const queryTerms = [
      ...publicIdCandidates.map(
        (candidate) => `public_id="${this.escapeCloudinarySearch(candidate)}"`,
      ),
      ...filenameCandidates.map(
        (candidate) => `filename="${this.escapeCloudinarySearch(candidate)}"`,
      ),
    ];

    if (queryTerms.length === 0) {
      return null;
    }

    try {
      const result = await cloudinary.search
        .expression(`resource_type:image AND (${queryTerms.join(' OR ')})`)
        .max_results(1)
        .execute();
      const secureUrl = result.resources?.[0]?.secure_url;
      return typeof secureUrl === 'string' && secureUrl.length > 0
        ? secureUrl
        : null;
    } catch {
      return null;
    }
  }

  private escapeCloudinarySearch(value: string) {
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  async updateUserStatus(id: number, updateUserStatusDto: UpdateUserStatusDto) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('Khong tim thay nguoi dung');
    }

    if (user.role.name === 'admin') {
      throw new ForbiddenException(
        'Ban khong co quyen thay doi trang thai cua tai khoan Admin',
      );
    }

    user.is_active = updateUserStatusDto.is_active;
    const savedUser = await this.userRepository.save(user);
    return this.sanitizeUser(savedUser);
  }

  async getAllCategories() {
    return this.categoryRepository.find({ order: { id: 'ASC' } });
  }

  async createCategory(payload: ManageCategoryDto) {
    const normalizedName = payload.name.trim();
    if (!normalizedName) {
      throw new BadRequestException('Ten danh muc khong hop le');
    }

    const existed = await this.categoryRepository.findOne({
      where: { name: normalizedName },
    });
    if (existed) {
      throw new BadRequestException('Danh muc da ton tai');
    }

    const category = this.categoryRepository.create({
      name: normalizedName,
      description: payload.description?.trim() || null,
    });

    return this.categoryRepository.save(category);
  }

  async updateCategory(id: number, payload: ManageCategoryDto) {
    const category = await this.categoryRepository.findOneBy({ id });
    if (!category) {
      throw new NotFoundException('Khong tim thay danh muc');
    }

    const normalizedName = payload.name.trim();
    if (!normalizedName) {
      throw new BadRequestException('Ten danh muc khong hop le');
    }

    const existed = await this.categoryRepository.findOne({
      where: { name: normalizedName },
    });
    if (existed && existed.id !== id) {
      throw new BadRequestException('Danh muc da ton tai');
    }

    category.name = normalizedName;
    category.description = payload.description?.trim() || null;
    return this.categoryRepository.save(category);
  }

  async deleteCategory(id: number) {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['posts'],
    });

    if (!category) {
      throw new NotFoundException('Khong tim thay danh muc');
    }

    if (category.posts && category.posts.length > 0) {
      throw new BadRequestException('Danh muc dang duoc su dung boi tin dang');
    }

    await this.categoryRepository.remove(category);
    return { success: true, deletedId: id };
  }

  async getAllAmenities() {
    return this.amenityRepository.find({ order: { id: 'ASC' } });
  }

  async createAmenity(payload: ManageAmenityDto) {
    const normalizedName = payload.name.trim();
    if (!normalizedName) {
      throw new BadRequestException('Ten tien ich khong hop le');
    }

    const existed = await this.amenityRepository.findOne({
      where: { name: normalizedName },
    });
    if (existed) {
      throw new BadRequestException('Tien ich da ton tai');
    }

    const amenity = this.amenityRepository.create({
      name: normalizedName,
      icon_url: payload.iconUrl?.trim() || null,
    });

    return this.amenityRepository.save(amenity);
  }

  async updateAmenity(id: number, payload: ManageAmenityDto) {
    const amenity = await this.amenityRepository.findOneBy({ id });
    if (!amenity) {
      throw new NotFoundException('Khong tim thay tien ich');
    }

    const normalizedName = payload.name.trim();
    if (!normalizedName) {
      throw new BadRequestException('Ten tien ich khong hop le');
    }

    const existed = await this.amenityRepository.findOne({
      where: { name: normalizedName },
    });
    if (existed && existed.id !== id) {
      throw new BadRequestException('Tien ich da ton tai');
    }

    amenity.name = normalizedName;
    amenity.icon_url = payload.iconUrl?.trim() || null;
    return this.amenityRepository.save(amenity);
  }

  async deleteAmenity(id: number) {
    const amenity = await this.amenityRepository.findOne({
      where: { id },
      relations: ['posts'],
    });

    if (!amenity) {
      throw new NotFoundException('Khong tim thay tien ich');
    }

    if (amenity.posts && amenity.posts.length > 0) {
      throw new BadRequestException('Tien ich dang duoc su dung boi tin dang');
    }

    await this.amenityRepository.remove(amenity);
    return { success: true, deletedId: id };
  }
}
