import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { NotificationsService } from 'src/notifications/notifications.service';
import { AmenityEntity } from 'src/database/entities/amenity.entity';
import { CategoryEntity } from 'src/database/entities/category.entity';
import { PostEntity } from 'src/database/entities/post.entity';
import { PostImageEntity } from 'src/database/entities/post-image.entity';
import { SavedPostEntity } from 'src/database/entities/saved-post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { SearchPostDto } from './dto/search-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

type RequestUser = {
  id?: number;
  userId?: number;
  role?: string;
};

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    @InjectRepository(AmenityEntity)
    private readonly amenityRepository: Repository<AmenityEntity>,
    @InjectRepository(SavedPostEntity)
    private readonly savedPostRepository: Repository<SavedPostEntity>,
    private readonly notificationsService: NotificationsService,
  ) {}

  private getRequester(user?: RequestUser | null) {
    const userId = Number(user?.userId ?? user?.id);
    const role = user?.role?.toLowerCase();

    return {
      userId: Number.isFinite(userId) && userId > 0 ? userId : null,
      role,
      isAdmin: role === 'admin',
    };
  }

  private getRequesterId(user?: RequestUser | null): number {
    const requester = this.getRequester(user);
    if (!requester.userId) {
      throw new ForbiddenException('Khong the xac dinh nguoi dung hien tai');
    }

    return requester.userId;
  }

  private sanitizeUser<T extends { password_hash?: string | null } | null>(
    user: T,
  ) {
    if (!user) {
      return user;
    }

    const { password_hash, ...safeUser } = user;
    return safeUser;
  }

  private canAccessPost(post: PostEntity, user?: RequestUser | null) {
    if (post.status === 'approved') {
      return true;
    }

    const requester = this.getRequester(user);
    return requester.isAdmin || requester.userId === post.userId;
  }

  async create(createPostDto: CreatePostDto, user: RequestUser) {
    const {
      categoryId,
      categoryName,
      amenityIds,
      amenityNames,
      imageUrls,
      ...postData
    } = createPostDto;

    let category: CategoryEntity | null = null;
    const normalizedCategoryName = categoryName?.trim();

    if (typeof categoryId === 'number') {
      category = await this.categoryRepository.findOne({
        where: { id: categoryId },
      });
      if (!category) {
        throw new NotFoundException('Khong tim thay loai phong');
      }
    } else if (normalizedCategoryName) {
      category = await this.categoryRepository.findOne({
        where: { name: normalizedCategoryName },
      });
      if (!category) {
        category = await this.categoryRepository.save(
          this.categoryRepository.create({
            name: normalizedCategoryName,
            description: 'Auto created category',
          }),
        );
      }
    } else {
      const [fallbackCategory] = await this.categoryRepository.find({
        order: { id: 'ASC' },
        take: 1,
      });
      category =
        fallbackCategory ??
        (await this.categoryRepository.save(
          this.categoryRepository.create({
            name: 'Uncategorized',
            description: 'Auto created category',
          }),
        ));
    }

    let amenities: AmenityEntity[] = [];
    if (amenityIds && amenityIds.length > 0) {
      amenities = await this.amenityRepository.findBy({ id: In(amenityIds) });
    } else if (amenityNames && amenityNames.length > 0) {
      const normalizedNames = Array.from(
        new Set(amenityNames.map((name) => name.trim()).filter(Boolean)),
      );

      if (normalizedNames.length > 0) {
        const existingAmenities = await this.amenityRepository.findBy({
          name: In(normalizedNames),
        });
        const existingNameSet = new Set(
          existingAmenities.map((amenity) => amenity.name),
        );
        const newAmenities = normalizedNames
          .filter((name) => !existingNameSet.has(name))
          .map((name) => this.amenityRepository.create({ name }));
        const createdAmenities =
          newAmenities.length > 0
            ? await this.amenityRepository.save(newAmenities)
            : [];
        amenities = [...existingAmenities, ...createdAmenities];
      }
    }

    const images =
      imageUrls?.map((url) => {
        const img = new PostImageEntity();
        img.image_url = url;
        return img;
      }) ?? [];

    const newPost = this.postRepository.create({
      ...postData,
      category,
      amenities,
      images,
      userId: this.getRequesterId(user),
      status: 'pending',
    });

    return this.postRepository.save(newPost);
  }

  async findAll(searchPostDto: SearchPostDto) {
    const {
      keyword,
      price_min,
      price_max,
      area_min,
      area_max,
      category_id,
      amenity_ids,
      lat,
      lng,
      radius,
      campus,
      availability,
    } = searchPostDto;

    const queryBuilder = this.postRepository.createQueryBuilder('post');
    queryBuilder
      .where('post.status = :status', { status: 'approved' })
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.images', 'images')
      .leftJoinAndSelect('post.amenities', 'amenities');

    if (keyword) {
      queryBuilder.andWhere(
        '(post.title ILIKE :keyword OR post.address ILIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }
    if (price_min) {
      queryBuilder.andWhere('post.price >= :price_min', { price_min });
    }
    if (price_max) {
      queryBuilder.andWhere('post.price <= :price_max', { price_max });
    }
    if (area_min) {
      queryBuilder.andWhere('post.area >= :area_min', { area_min });
    }
    if (area_max) {
      queryBuilder.andWhere('post.area <= :area_max', { area_max });
    }
    if (campus) {
      queryBuilder.andWhere('post.campus = :campus', { campus });
    }
    if (availability) {
      queryBuilder.andWhere('post.availability = :availability', {
        availability,
      });
    }
    if (category_id) {
      queryBuilder.andWhere('post.categoryId = :category_id', { category_id });
    }
    if (lat && lng && radius) {
      const haversineFormula = `(6371 * acos(cos(radians(:lat)) * cos(radians(post.latitude)) * cos(radians(post.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(post.latitude))))`;
      queryBuilder.andWhere(`${haversineFormula} <= :radius`, {
        lat,
        lng,
        radius,
      });
    }

    if (amenity_ids && amenity_ids.length > 0) {
      queryBuilder
        .innerJoin('post.amenities', 'amenity')
        .andWhere('amenity.id IN (:...ids)', { ids: amenity_ids })
        .groupBy('post.id, category.id, images.id, amenities.id')
        .having('COUNT(DISTINCT amenity.id) = :count', {
          count: amenity_ids.length,
        });
    }

    queryBuilder.orderBy('post.createdAt', 'DESC');
    return queryBuilder.getMany();
  }

  async findOne(id: number, user?: RequestUser | null) {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: [
        'category',
        'amenities',
        'images',
        'user',
        'user.profile',
        'reviews',
        'reviews.user',
        'reviews.user.profile',
      ],
    });

    if (!post || !this.canAccessPost(post, user)) {
      throw new NotFoundException('Không tìm thấy tin đăng');
    }

    const averageRating =
      post.reviews && post.reviews.length > 0
        ? parseFloat(
            (
              post.reviews.reduce((sum, review) => sum + review.rating, 0) /
              post.reviews.length
            ).toFixed(1),
          )
        : 0;

    return {
      ...post,
      user: this.sanitizeUser(post.user),
      reviews:
        post.reviews?.map((review) => ({
          ...review,
          user: this.sanitizeUser(review.user),
        })) ?? [],
      averageRating,
      reviewCount: post.reviews ? post.reviews.length : 0,
    };
  }

  async findMine(user: RequestUser) {
    const ownerId = this.getRequesterId(user);

    return this.postRepository.find({
      where: { userId: ownerId },
      relations: ['category', 'amenities', 'images'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: number, updatePostDto: UpdatePostDto, user: RequestUser) {
    const post = await this.postRepository.findOneBy({ id });
    if (!post) {
      throw new NotFoundException('Không tìm thấy tin đăng');
    }

    if (post.userId !== this.getRequesterId(user)) {
      throw new ForbiddenException('Bạn không có quyền để sửa tin này');
    }

    const { categoryId, amenityIds, imageUrls, ...postData } = updatePostDto;
    const requiresReapproval = post.status !== 'pending';

    Object.assign(post, postData);

    if (requiresReapproval) {
      post.status = 'pending';
      post.rejectionReason = null;
      post.resubmittedAt = new Date();
    }

    if (categoryId) {
      const category = await this.categoryRepository.findOneBy({ id: categoryId });
      if (!category) {
        throw new NotFoundException('Không tìm thấy loại phòng');
      }
      post.category = category;
    }

    if (amenityIds) {
      post.amenities = await this.amenityRepository.findBy({ id: In(amenityIds) });
    }

    if (imageUrls) {
      post.images = imageUrls.map((url) => {
        const img = new PostImageEntity();
        img.image_url = url;
        img.postId = post.id;
        return img;
      });
    }

    return this.postRepository.save(post);
  }

  async approve(id: number, status: string, rejectionReason?: string) {
    const post = await this.postRepository.findOneBy({ id });
    if (!post) {
      throw new NotFoundException('Không tìm thấy tin đăng');
    }

    if (!['approved', 'rejected', 'hidden'].includes(status)) {
      throw new BadRequestException('Trạng thái không hợp lệ');
    }

    post.status = status as PostEntity['status'];

    let notifTitle = '';
    let notifMessage = '';

    if (status === 'approved') {
      post.rejectionReason = null;
      post.resubmittedAt = null;
      notifTitle = 'Tin đăng của bạn đã được duyệt';
      notifMessage = `Tin "${post.title}" đã được duyệt và hiển thị công khai.`;
    } else if (status === 'rejected') {
      post.rejectionReason = rejectionReason || 'Bài đăng vi phạm quy định';
      notifTitle = 'Tin đăng bị từ chối';
      notifMessage = `Tin "${post.title}" bị từ chối. Lý do: ${post.rejectionReason}`;
    }

    if (notifTitle) {
      await this.notificationsService.createNotification(
        post.userId,
        notifTitle,
        notifMessage,
        'listing',
        post.id,
      );
    }

    return this.postRepository.save(post);
  }

  async findAllForAdmin(status?: string) {
    const query = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.images', 'images')
      .leftJoinAndSelect('post.amenities', 'amenities')
      .orderBy('post.createdAt', 'DESC');

    if (status && status !== 'all') {
      query.where('post.status = :status', { status });
    }

    const posts = await query.getMany();
    return posts.map((post) => ({
      ...post,
      user: this.sanitizeUser(post.user),
    }));
  }

  async getMySavedPostIds(user: RequestUser) {
    const userId = this.getRequesterId(user);
    const savedItems = await this.savedPostRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return savedItems.map((item) => item.postId);
  }

  async savePost(postId: number, user: RequestUser) {
    const userId = this.getRequesterId(user);

    const post = await this.postRepository.findOneBy({ id: postId });
    if (!post || post.status !== 'approved') {
      throw new NotFoundException('Không tìm thấy tin đăng để lưu');
    }

    const existed = await this.savedPostRepository.findOneBy({ userId, postId });
    if (existed) {
      return { postId, saved: true };
    }

    const savedPost = this.savedPostRepository.create({ userId, postId });
    await this.savedPostRepository.save(savedPost);
    return { postId, saved: true };
  }

  async unsavePost(postId: number, user: RequestUser) {
    const userId = this.getRequesterId(user);
    await this.savedPostRepository.delete({ userId, postId });
    return { postId, saved: false };
  }

  async delete(id: number, user: RequestUser) {
    const post = await this.postRepository.findOneBy({ id });
    if (!post) {
      throw new NotFoundException('Khong tim thay tin dang');
    }

    const requester = this.getRequester(user);
    if (!requester.isAdmin && requester.userId !== post.userId) {
      throw new ForbiddenException(
        'Chỉ chủ bài đăng hoặc admin mới có quyền xoá bài đăng này',
      );
    }

    await this.postRepository.remove(post);
    return { message: 'Xoá tin đăng thành công' };
  }
}
