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
import { FindManyOptions, Not, Repository } from 'typeorm';
import { AmenityEntity } from 'src/database/entities/amenity.entity';
import { CategoryEntity } from 'src/database/entities/category.entity';
import { PostEntity } from 'src/database/entities/post.entity';
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
