import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostEntity } from '../database/entities/post.entity';
import { CreateRoommateRequestDto } from './dto/create-roommate-request.dto';

type RoommateMode = 'LANDLORD_ASSIST' | 'TENANT_SELF';
type RoommateStatus = 'pending' | 'approved' | 'rejected';

type RoommatePostRecord = {
  id: string;
  listingId: number;
  title: string;
  requestedSlots: number;
  status: RoommateStatus;
  mode: RoommateMode;
  createdAt: string;
  tenantId: number;
};

@Injectable()
export class RoommateManagementService {
  private readonly roommatePosts: RoommatePostRecord[] = [];
  private postSeq = 1;

  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
  ) {}

  async getListings() {
    const listings = await this.postRepository.find({
      where: { status: 'approved', availability: 'available' },
      relations: ['user', 'user.profile'],
      order: { updatedAt: 'DESC' },
    });

    return listings.map((listing) => {
      const approvedSlots = this.roommatePosts
        .filter(
          (post) => post.listingId === listing.id && post.status === 'approved',
        )
        .reduce((sum, post) => sum + post.requestedSlots, 0);

      return {
        id: listing.id,
        title: listing.title,
        address: listing.address,
        landlordName:
          listing.user?.profile?.full_name ||
          listing.user?.username ||
          listing.user?.email ||
          'Chủ trọ',
        currentOccupancy: approvedSlots,
        maxOccupancy: listing.max_occupancy || 1,
      };
    });
  }

  async getRoommatePosts(tenantId: number, listingId?: number) {
    return this.roommatePosts
      .filter((post) => post.tenantId === tenantId)
      .filter((post) => (listingId ? post.listingId === listingId : true))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }

  async createRoommateRequest(
    tenantId: number,
    role: string,
    payload: CreateRoommateRequestDto,
  ) {
    if (role !== 'student') {
      throw new ForbiddenException(
        'Chỉ tài khoản student mới được tạo yêu cầu ở ghép.',
      );
    }

    const listing = await this.postRepository.findOne({
      where: { id: payload.listingId },
    });
    if (!listing) {
      throw new NotFoundException('Không tìm thấy phòng trọ gốc.');
    }

    const maxOccupancy = listing.max_occupancy || 1;
    const approvedSlots = this.roommatePosts
      .filter(
        (post) => post.listingId === listing.id && post.status === 'approved',
      )
      .reduce((sum, post) => sum + post.requestedSlots, 0);
    const capacityLeft = Math.max(0, maxOccupancy - approvedSlots);

    if (payload.requestedSlots > capacityLeft) {
      throw new BadRequestException(
        'Số người cần thêm vượt quá sức chứa còn lại.',
      );
    }

    const status: RoommateStatus =
      payload.mode === 'LANDLORD_ASSIST' ? 'pending' : 'pending';

    const record: RoommatePostRecord = {
      id: `RM-${String(this.postSeq++).padStart(4, '0')}`,
      listingId: listing.id,
      title: payload.title,
      requestedSlots: payload.requestedSlots,
      status,
      mode: payload.mode,
      createdAt: new Date().toISOString(),
      tenantId,
    };

    this.roommatePosts.unshift(record);
    return record;
  }
}
