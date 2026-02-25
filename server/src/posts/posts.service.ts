import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException, // 👈 Thêm cái này để báo lỗi nếu status sai
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PostEntity } from 'src/database/entities/post.entity';
import { CategoryEntity } from 'src/database/entities/category.entity';
import { AmenityEntity } from 'src/database/entities/amenity.entity';
import { PostImageEntity } from 'src/database/entities/post-image.entity';
import { SavedPostEntity } from 'src/database/entities/saved-post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { SearchPostDto } from './dto/search-post.dto';
import { NotificationsService } from 'src/notifications/notifications.service';

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

  private getRequesterId(user: any): number {
    const requesterId = Number(user?.userId ?? user?.id);
    if (!requesterId || Number.isNaN(requesterId)) {
      throw new ForbiddenException('Không thể xác định người dùng hiện tại');
    }
    return requesterId;
  }

  // Tạo tin đăng mới
  async create(createPostDto: CreatePostDto, user: any) {
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
        throw new NotFoundException('Không tìm thấy loại phòng (Category)');
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
      if (fallbackCategory) {
        category = fallbackCategory;
      } else {
        category = await this.categoryRepository.save(
          this.categoryRepository.create({
            name: 'Uncategorized',
            description: 'Auto created category',
          }),
        );
      }
    }

    let amenities: AmenityEntity[] = [];
    if (amenityIds && amenityIds.length > 0) {
      amenities = await this.amenityRepository.findBy({
        id: In(amenityIds),
      });
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

    let images: PostImageEntity[] = [];
    if (imageUrls && imageUrls.length > 0) {
      images = imageUrls.map((url) => {
        const img = new PostImageEntity();
        img.image_url = url;
        return img;
      });
    }

    const newPost = this.postRepository.create({
      ...postData,
      category: category,
      amenities: amenities,
      images: images,
      userId: user.userId,
      status: 'pending',
    });

    return this.postRepository.save(newPost);
  }

  // Hàm lấy danh sách tất cả tin đăng đã được duyệt
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

    // Chỉ lấy tin đã duyệt
    queryBuilder.where('post.status = :status', { status: 'approved' });

    queryBuilder
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.images', 'images')
      .leftJoinAndSelect('post.amenities', 'amenities');

    if (keyword) {
      queryBuilder.andWhere(
        '(post.title LIKE :keyword OR post.address LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    if (price_min) {
      queryBuilder.andWhere('post.price >= :price_min', { price_min });
    }
    if (price_max) {
      queryBuilder.andWhere('post.price <= :price_max', { price_max });
    }

    if (lat && lng && radius) {
      const haversineFormula = `(6371 * acos(cos(radians(:lat)) * cos(radians(post.latitude)) * cos(radians(post.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(post.latitude))))`;
      queryBuilder.andWhere(`${haversineFormula} <= :radius`, {
        lat,
        lng,
        radius,
      });
      queryBuilder.orderBy('post.createdAt', 'DESC');
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

    if (amenity_ids && amenity_ids.length > 0) {
      const ids = amenity_ids;
      queryBuilder
        .innerJoin('post.amenities', 'amenity')
        .andWhere('amenity.id IN (:...ids)', { ids })
        .groupBy('post.id, category.id, images.id, amenities.id')
        .having('COUNT(DISTINCT amenity.id) = :count', { count: ids.length });
    }

    queryBuilder.orderBy('post.createdAt', 'DESC');
    return queryBuilder.getMany();
  }

  // Hàm lấy chi tiết một tin đăng
  async findOne(id: number) {
    const post = await this.postRepository.findOne({
      where: {
        id: id,
        // status: 'approved', // Tạm thời comment dòng này để Chủ trọ xem được tin chưa duyệt của mình
      },
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

    if (!post) {
      throw new NotFoundException('Không tìm thấy tin đăng');
    }

    if (post.user) {
      delete post.user.password_hash;
    }

    let averageRating = 0;
    if (post.reviews && post.reviews.length > 0) {
      const total = post.reviews.reduce(
        (sum, review) => sum + review.rating,
        0,
      );
      averageRating = parseFloat((total / post.reviews.length).toFixed(1));
      post.reviews.forEach((review) => {
        if (review.user) {
          delete review.user.password_hash;
        }
      });
    }

    return {
      ...post,
      averageRating: averageRating,
      reviewCount: post.reviews ? post.reviews.length : 0,
    };
  }

  // Hàm lấy danh sách tin đăng của chủ trọ
  async findMine(user: any) {
    console.log('User requesting mine:', user); // 👈 Thêm dòng này xem Server nhận được gì

    // Nếu user log ra là { userId: 1, ... } thì dùng userId
    // Nếu user log ra là { id: 1, ... } thì dùng id
    const ownerId = user.userId || user.id;

    return this.postRepository.find({
      where: {
        // 👇 Sửa chỗ này để khớp với tên cột trong DB (thường là user_id map vào user.id hoặc userId)
        // Nếu trong Entity Post em khai báo @Column({ name: 'user_id' }) userId: number;
        userId: ownerId,
      },
      relations: ['category', 'amenities', 'images'],
      order: { createdAt: 'DESC' },
    });
  }

  // Hàm cập nhật tin đăng theo ID
  async update(id: number, updatePostDto: UpdatePostDto, user: any) {
    const post = await this.postRepository.findOneBy({ id });
    if (!post) {
      throw new NotFoundException('Không tìm thấy tin đăng');
    }

    if (post.userId !== user.userId) {
      throw new ForbiddenException('Bạn không có quyền sửa tin đăng này');
    }

    const { categoryId, amenityIds, imageUrls, ...postData } = updatePostDto;

    const wasRejected = post.status === 'rejected';
    Object.assign(post, postData);

    if (wasRejected) {
      post.status = 'pending';
      post.rejectionReason = null;
      post.resubmittedAt = new Date();
    }

    if (categoryId) {
      const category = await this.categoryRepository.findOneBy({
        id: categoryId,
      });
      if (!category) {
        throw new NotFoundException('Không tìm thấy loại phòng');
      }
      post.category = category;
    }

    if (amenityIds) {
      const amenities = await this.amenityRepository.findBy({
        id: In(amenityIds),
      });
      post.amenities = amenities;
    }

    if (imageUrls) {
      const images = imageUrls.map((url) => {
        const img = new PostImageEntity();
        img.image_url = url;
        img.postId = post.id;
        return img;
      });
      post.images = images;
    }

    return this.postRepository.save(post);
  }

  // ----------------------------------------------------------------
  // 👇 1. Hàm Duyệt tin (Mới)
  async approve(id: number, status: string, rejectionReason?: string) {
    const post = await this.postRepository.findOneBy({ id });
    if (!post) throw new NotFoundException('Không tìm thấy tin đăng');

    if (status !== 'approved' && status !== 'rejected' && status !== 'hidden') {
      throw new BadRequestException('Trạng thái không hợp lệ');
    }

    post.status = status;

    let notifTitle = '';
    let notifMessage = '';

    if (status === 'approved') {
      post.rejectionReason = null;
      post.resubmittedAt = null;
      notifTitle = 'Tin đăng của bạn đã được duyệt! 🎉';
      notifMessage = `Tin "${post.title}" đã được duyệt và hiển thị công khai.`;
    } else if (status === 'rejected') {
      post.rejectionReason = rejectionReason || 'Bài đăng vi phạm quy định';
      notifTitle = 'Tin đăng bị từ chối 😞';
      notifMessage = `Tin "${post.title}" bị từ chối. Lý do: ${post.rejectionReason}`;
    }

    // Gọi service tạo thông báo
    if (notifTitle) {
      await this.notificationsService.createNotification(
        post.userId, // ID chủ trọ
        notifTitle,
        notifMessage,
        'listing', // type
        post.id, // relatedId
      );
    }

    return this.postRepository.save(post);
  }
  // ----------------------------------------------------------------

  // 👇 2. Hàm Lấy tin cho Admin (Mới)
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

    return query.getMany();
  }

  async getMySavedPostIds(user: any) {
    const userId = this.getRequesterId(user);
    const savedItems = await this.savedPostRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return savedItems.map((item) => item.postId);
  }

  async savePost(postId: number, user: any) {
    const userId = this.getRequesterId(user);

    const post = await this.postRepository.findOneBy({ id: postId });
    if (!post || post.status !== 'approved') {
      throw new NotFoundException('Không tìm thấy tin đăng để lưu');
    }

    const existed = await this.savedPostRepository.findOneBy({
      userId,
      postId,
    });
    if (existed) {
      return { postId, saved: true };
    }

    const savedPost = this.savedPostRepository.create({ userId, postId });
    await this.savedPostRepository.save(savedPost);
    return { postId, saved: true };
  }

  async unsavePost(postId: number, user: any) {
    const userId = this.getRequesterId(user);

    await this.savedPostRepository.delete({ userId, postId });
    return { postId, saved: false };
  }

  // Hàm xóa tin đăng theo ID
  async delete(id: number, user: any) {
    const post = await this.postRepository.findOneBy({ id });
    if (!post) {
      throw new NotFoundException('Không tìm thấy tin đăng');
    }

    // 👇 LOGIC MỚI CỦA EM (Chỉ Chủ trọ được xóa) - DÙNG CÁI NÀY
    if (post.userId !== user.userId) {
      // Nếu không phải chính chủ -> Chặn luôn (kể cả Admin)
      throw new ForbiddenException('Chỉ chủ bài đăng mới có quyền xóa bài này');
    }

    await this.postRepository.remove(post);
    return { message: 'Xóa tin đăng thành công' };
  }
}
