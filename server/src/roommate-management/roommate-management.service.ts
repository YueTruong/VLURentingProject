import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from 'src/database/entities/category.entity';
import { PostEntity } from 'src/database/entities/post.entity';
import { PostImageEntity } from 'src/database/entities/post-image.entity';
import { RoommateRequestEntity } from 'src/database/entities/roommate-request.entity';
import { UserEntity } from 'src/database/entities/user.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import { CreateRoommateRequestDto } from './dto/create-roommate-request.dto';
import { UpdateRoommateApprovalDto } from './dto/update-roommate-approval.dto';
import { UpdateRoommateTrackingDto } from './dto/update-roommate-tracking.dto';

type AuthenticatedUser = {
  id?: number;
  userId?: number;
};

@Injectable()
export class RoommateManagementService {
  constructor(
    @InjectRepository(RoommateRequestEntity)
    private readonly roommateRequestRepository: Repository<RoommateRequestEntity>,
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly notificationsService: NotificationsService,
  ) {}

  private getRequesterId(user: AuthenticatedUser): number {
    const requesterId = Number(user?.userId ?? user?.id);
    if (!requesterId || Number.isNaN(requesterId)) {
      throw new ForbiddenException('Không thể xác định người dùng hiện tại');
    }
    return requesterId;
  }

  private ensureCapacity(
    currentOccupancy: number,
    maxOccupancy: number,
    requestedSlots: number,
  ) {
    if (currentOccupancy < 0) {
      throw new BadRequestException('Số người hiện tại không hợp lệ');
    }

    if (maxOccupancy <= 0) {
      throw new BadRequestException('Sức chứa tối đa phải lớn hơn 0');
    }

    if (currentOccupancy >= maxOccupancy) {
      throw new BadRequestException('Phòng đã đủ số người tối đa');
    }

    const capacityLeft = maxOccupancy - currentOccupancy;
    if (requestedSlots > capacityLeft) {
      throw new BadRequestException(
        `Số người cần thêm vượt quá chỗ trống còn lại (${capacityLeft})`,
      );
    }
  }

  private buildRequestTitle(listingTitle: string, requestedSlots: number) {
    return `Tìm ${requestedSlots} bạn ở ghép - ${listingTitle}`;
  }

  private buildRoommateDescription(
    request: RoommateRequestEntity,
    linkedPost: PostEntity,
  ) {
    return [
      `Tin ở ghép liên kết với phòng gốc "${linkedPost.title}".`,
      `Địa chỉ phòng: ${request.listingAddress}.`,
      request.landlordName ? `Chủ trọ: ${request.landlordName}.` : null,
      `Số người hiện tại: ${request.currentOccupancy}/${request.maxOccupancy}.`,
      `Đang tìm thêm ${request.requestedSlots} người ở ghép.`,
      request.mode === 'LANDLORD_ASSIST'
        ? 'Người đăng bài đã chọn hình thức nhờ chủ trọ hỗ trợ.'
        : 'Người đăng bài tự theo dõi và đã được quản trị viên duyệt.',
      linkedPost.description
        ? `Thông tin phòng gốc: ${linkedPost.description}`
        : null,
    ]
      .filter(Boolean)
      .join(' ');
  }

  private async ensureRoommateCategory() {
    const existingCategory = await this.categoryRepository.findOne({
      where: { name: 'Ở ghép' },
    });

    if (existingCategory) {
      if (
        existingCategory.description !== 'Danh mục bài đăng tìm người ở ghép'
      ) {
        existingCategory.description = 'Danh mục bài đăng tìm người ở ghép';
        return this.categoryRepository.save(existingCategory);
      }
      return existingCategory;
    }

    return this.categoryRepository.save(
      this.categoryRepository.create({
        name: 'Ở ghép',
        description: 'Danh mục bài đăng tìm người ở ghép',
      }),
    );
  }

  private async publishApprovedRequest(request: RoommateRequestEntity) {
    const linkedPost = await this.postRepository.findOne({
      where: { id: request.listingPostId },
      relations: ['category', 'amenities', 'images'],
    });

    if (!linkedPost) {
      throw new NotFoundException(
        'Không tìm thấy phòng gốc để tạo bài đăng công khai',
      );
    }

    const roommateCategory = await this.ensureRoommateCategory();
    const publicTitle = this.buildRequestTitle(
      request.listingTitle,
      request.requestedSlots,
    );
    const peopleAfterJoin = Math.max(
      1,
      request.currentOccupancy + request.requestedSlots,
    );
    const roommatePrice = Number(linkedPost.price) / peopleAfterJoin;
    const images = (linkedPost.images ?? []).map((image) => {
      const nextImage = new PostImageEntity();
      nextImage.image_url = image.image_url;
      nextImage.is_video = image.is_video;
      return nextImage;
    });

    let publicPost: PostEntity | null = null;
    if (request.publicPostId) {
      publicPost = await this.postRepository.findOne({
        where: { id: request.publicPostId },
        relations: ['images', 'amenities', 'category'],
      });
    }

    const payload: Partial<PostEntity> = {
      title: publicTitle,
      description: this.buildRoommateDescription(request, linkedPost),
      price:
        Number.isFinite(roommatePrice) && roommatePrice > 0
          ? roommatePrice
          : Number(linkedPost.price),
      area: linkedPost.area,
      address: linkedPost.address,
      campus: linkedPost.campus,
      availability: 'available',
      videoUrl: linkedPost.videoUrl,
      latitude: linkedPost.latitude,
      longitude: linkedPost.longitude,
      max_occupancy: request.requestedSlots,
      status: 'approved',
      userId: request.studentId,
      category: roommateCategory,
      amenities: linkedPost.amenities ?? [],
      rejectionReason: null,
      resubmittedAt: null,
    };

    request.title = publicTitle;

    if (publicPost) {
      Object.assign(publicPost, payload);
      if (!publicPost.images?.length && images.length) {
        publicPost.images = images;
      }
      publicPost = await this.postRepository.save(publicPost);
      return publicPost;
    }

    const createdPost = this.postRepository.create({
      ...payload,
      images,
    });
    return this.postRepository.save(createdPost);
  }

  private async unpublishApprovedRequest(request: RoommateRequestEntity) {
    if (!request.publicPostId) return null;

    const publicPost = await this.postRepository.findOneBy({
      id: request.publicPostId,
    });

    if (!publicPost) return null;

    publicPost.status = 'hidden';
    return this.postRepository.save(publicPost);
  }

  private async syncApprovedRequestPublicPost(request: RoommateRequestEntity) {
    if (request.approvalStatus !== 'approved' || request.publicPostId) {
      return request;
    }

    const publicPost = await this.publishApprovedRequest(request);
    request.publicPostId = publicPost.id;
    return this.roommateRequestRepository.save(request);
  }

  private async getAdminRecipients() {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('LOWER(role.name) = :roleName', { roleName: 'admin' })
      .andWhere('user.is_active = :isActive', { isActive: true })
      .getMany();
  }

  async getListingOptions() {
    const posts = await this.postRepository.find({
      where: {
        status: 'approved',
        availability: 'available',
      },
      relations: ['user', 'user.profile'],
      order: { createdAt: 'DESC' },
      take: 50,
    });

    return posts.map((post) => ({
      id: post.id,
      title: post.title,
      address: post.address,
      landlordName:
        post.user?.profile?.full_name ?? post.user?.username ?? null,
      currentOccupancy: 0,
      maxOccupancy: post.max_occupancy ?? 1,
    }));
  }

  async findMine(user: AuthenticatedUser) {
    const studentId = this.getRequesterId(user);

    const requests = await this.roommateRequestRepository.find({
      where: { studentId },
      order: { createdAt: 'DESC' },
    });

    return Promise.all(
      requests.map((request) => this.syncApprovedRequestPublicPost(request)),
    );
  }

  async findAllForAdmin(status?: string) {
    const query = this.roommateRequestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.student', 'student')
      .leftJoinAndSelect('student.profile', 'studentProfile')
      .leftJoinAndSelect('request.landlord', 'landlord')
      .leftJoinAndSelect('landlord.profile', 'landlordProfile')
      .orderBy('request.createdAt', 'DESC');

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.where('request.approvalStatus = :status', { status });
    }

    const requests = await query.getMany();
    return Promise.all(
      requests.map((request) => this.syncApprovedRequestPublicPost(request)),
    );
  }

  async create(
    createRoommateRequestDto: CreateRoommateRequestDto,
    user: AuthenticatedUser,
  ) {
    const studentId = this.getRequesterId(user);
    const {
      listingPostId,
      requestedSlots,
      mode,
      currentOccupancy,
      maxOccupancy,
      notifyLandlord,
      landlordConsent,
    } = createRoommateRequestDto;

    this.ensureCapacity(currentOccupancy, maxOccupancy, requestedSlots);

    const listingPost = await this.postRepository.findOne({
      where: {
        id: listingPostId,
        status: 'approved',
      },
      relations: ['user', 'user.profile'],
    });

    if (!listingPost) {
      throw new NotFoundException('Không tìm thấy phòng gốc để liên kết');
    }

    const roommateRequest = this.roommateRequestRepository.create({
      listingPostId: listingPost.id,
      studentId,
      landlordId: listingPost.userId ?? null,
      mode,
      approvalStatus: 'pending',
      requestedSlots,
      notifyLandlord: Boolean(notifyLandlord),
      landlordConsent: Boolean(landlordConsent),
      title: this.buildRequestTitle(listingPost.title, requestedSlots),
      listingTitle: listingPost.title,
      listingAddress: listingPost.address,
      landlordName:
        listingPost.user?.profile?.full_name ??
        listingPost.user?.username ??
        null,
      currentOccupancy,
      maxOccupancy,
    });

    const savedRequest =
      await this.roommateRequestRepository.save(roommateRequest);

    const adminRecipients = await this.getAdminRecipients();
    for (const admin of adminRecipients) {
      const title = 'Yêu cầu ở ghép mới cần duyệt';
      const message = `Có yêu cầu ở ghép mới cho phòng "${savedRequest.listingTitle}" đang chờ quản trị viên duyệt.`;

      await this.notificationsService.createNotification(
        admin.id,
        title,
        message,
        'roommate',
        savedRequest.id,
      );
    }

    return savedRequest;
  }

  async updateTracking(
    id: number,
    payload: UpdateRoommateTrackingDto,
    user: AuthenticatedUser,
  ) {
    const studentId = this.getRequesterId(user);
    const request = await this.roommateRequestRepository.findOneBy({
      id,
      studentId,
    });

    if (!request) {
      throw new NotFoundException('Không tìm thấy yêu cầu ở ghép');
    }

    if (typeof payload.notifyLandlord === 'boolean') {
      request.notifyLandlord = payload.notifyLandlord;
    }
    if (typeof payload.landlordConsent === 'boolean') {
      request.landlordConsent = payload.landlordConsent;
    }

    return this.roommateRequestRepository.save(request);
  }

  async review(
    id: number,
    payload: UpdateRoommateApprovalDto,
    _user: AuthenticatedUser,
  ) {
    const request = await this.roommateRequestRepository.findOneBy({ id });

    if (!request) {
      throw new NotFoundException('Không tìm thấy yêu cầu ở ghép');
    }

    request.approvalStatus = payload.approvalStatus;
    if (request.approvalStatus === 'approved') {
      const publicPost = await this.publishApprovedRequest(request);
      request.publicPostId = publicPost.id;
    } else {
      await this.unpublishApprovedRequest(request);
    }

    const savedRequest = await this.roommateRequestRepository.save(request);

    const title =
      savedRequest.approvalStatus === 'approved'
        ? 'Yêu cầu ở ghép đã được duyệt'
        : savedRequest.approvalStatus === 'rejected'
          ? 'Yêu cầu ở ghép bị từ chối'
          : 'Yêu cầu ở ghép đang chờ duyệt';
    const message =
      savedRequest.approvalStatus === 'approved'
        ? `Yêu cầu ở ghép cho phòng "${savedRequest.listingTitle}" đã được quản trị viên chấp nhận và đã hiển thị công khai.`
        : savedRequest.approvalStatus === 'rejected'
          ? `Yêu cầu ở ghép cho phòng "${savedRequest.listingTitle}" đã bị quản trị viên từ chối.`
          : `Yêu cầu ở ghép cho phòng "${savedRequest.listingTitle}" đã được chuyển về trạng thái chờ duyệt.`;

    await this.notificationsService.createNotification(
      savedRequest.studentId,
      title,
      message,
      'roommate',
      savedRequest.id,
    );

    return savedRequest;
  }

  async remove(id: number, user: AuthenticatedUser) {
    const studentId = this.getRequesterId(user);
    const request = await this.roommateRequestRepository.findOneBy({
      id,
      studentId,
    });

    if (!request) {
      throw new NotFoundException('Không tìm thấy yêu cầu ở ghép');
    }

    if (request.publicPostId) {
      const publicPost = await this.postRepository.findOneBy({
        id: request.publicPostId,
      });
      if (publicPost) {
        await this.postRepository.remove(publicPost);
      }
    }

    await this.roommateRequestRepository.remove(request);
    return { id, deleted: true };
  }
}
