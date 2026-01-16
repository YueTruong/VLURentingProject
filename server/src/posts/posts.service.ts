import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PostEntity } from 'src/database/entities/post.entity';
import { CategoryEntity } from 'src/database/entities/category.entity';
import { AmenityEntity } from 'src/database/entities/amenity.entity';
import { PostImageEntity } from 'src/database/entities/post-image.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UserEntity } from 'src/database/entities/user.entity';
import { UpdatePostDto } from './dto/update-post.dto';
import { SearchPostDto } from './dto/search-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    @InjectRepository(AmenityEntity)
    private readonly amenityRepository: Repository<AmenityEntity>,
  ) {}

  // Tạo tin đăng mới
  // @param createPostDto Dữ liệu từ client
  // @param user Thông tin user (từ JWT)
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
        throw new NotFoundException('Khong tim thay loai phong (Category)');
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

  // Hàm lấy danh sách tất cả tin đăng đã đươpc duyệt
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
    } = searchPostDto;

    // Xây dựng điều kiện truy vấn
    const queryBuilder = this.postRepository.createQueryBuilder('post');

    // Chỉ lấy tin đã duyệt
    queryBuilder.where('post.status = :status', { status: 'approved' });

    // Thêm các điều kiện lọc nếu có
    queryBuilder
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.images', 'images')
      .leftJoinAndSelect('post.amenities', 'amenities');

    // Lọc theo từ khoá
    if (keyword) {
      queryBuilder.andWhere(
        '(post.title LIKE :keyword OR post.address LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    // Lọc theo khoảng giá
    if (price_min) {
      queryBuilder.andWhere('post.price >= :price_min', { price_min });
    }
    if (price_max) {
      queryBuilder.andWhere('post.price <= :price_max', { price_max });
    }

    // Tìm kiếm theo bán kính
    if (lat && lng && radius) {
      // Công thức Haversine để tính khoảng cách giữa hai điểm trên bản đồ
      // 6371 là bán kính Trái Đất tính bằng km
      const haversineFormula = `(6371 * acos(cos(radians(:lat)) * cos(radians(post.latitude)) * cos(radians(post.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(post.latitude))))`;

      // Thêm điều kiện vào truy vấn
      queryBuilder.andWhere(`${haversineFormula} <= :radius`, {
        lat,
        lng,
        radius,
      });

      // Sắp xếp theo khoảng cách gần nhất
      queryBuilder.orderBy('post.createdAt', 'DESC');
    }

    // Lọc theo diện tích
    if (area_min) {
      queryBuilder.andWhere('post.area >= :area_min', { area_min });
    }
    if (area_max) {
      queryBuilder.andWhere('post.area <= :area_max', { area_max });
    }

    // Lọc theo loại phòng (Category)
    if (category_id) {
      queryBuilder.andWhere('post.categoryId = :category_id', { category_id });
    }

    // Lọc theo tiện ích (Amenities)
    if (amenity_ids && amenity_ids.length > 0) {
      const ids = amenity_ids;

      // Tham gia bảng post_amenities để lọc
      queryBuilder
        .innerJoin('post.amenities', 'amenity')
        .andWhere('amenity.id IN (:...ids)', { ids })
        .groupBy('post.id, category.id, images.id, amenities.id')
        .having('COUNT(DISTINCT amenity.id) = :count', { count: ids.length });
    }

    // Sắp xếp và thực thi
    queryBuilder.orderBy('post.createdAt', 'DESC');

    return queryBuilder.getMany(); // Lấy tất cả kết quả
  }

  // Hàm lấy chi tiết một tin đăng theo ID
  async findOne(id: number) {
    const post = await this.postRepository.findOne({
      where: {
        id: id,
        status: 'approved', // Chỉ lấy tin đã duyệt
      },
      // Lấy luôn quan hệ liên quan
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
      // Nếu không tìm thấy, ném lỗi NotFound
      throw new NotFoundException(
        'Không tìm thấy tin đăng hoặc tin chưa được duyệt',
      );
    }

    // Xóa hash mật khẩu của chủ trọ trước khi trả về
    if (post.user) {
      delete post.user.password_hash;
    }

    // Tính điểm trung bình từ đánh giá
    let averageRating = 0;
    if (post.reviews && post.reviews.length > 0) {
      const total = post.reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = parseFloat((total / post.reviews.length).toFixed(1)); // Làm tròn 1 chữ số thập phân

      // Xóa hash mật khẩu của người đánh giá
      post.reviews.forEach((review) => {
        if (review.user) {
          delete review.user.password_hash;
        }
      });
    }

    return {
      ...post,
      averageRating: averageRating,
      reviewCount: post.reviews.length,
    };
  }

  // Hàm cập nhật tin đăng theo ID
  async update(id: number, updatePostDto: UpdatePostDto, user: any) {
    // Tìm tin đăng cần cập nhật
    const post = await this.postRepository.findOneBy({ id });
    if (!post) {
      throw new NotFoundException('Không tìm thấy tin đăng');
    }

    // Kiểm tra quyền: chỉ chủ trọ tạo tin đăng mới được cập nhật
    if (post.userId !== user.userId) {
      throw new ForbiddenException('Bạn không có quyền sửa tin đăng này');
    }

    // Xử lý các trường hợp cập nhật liên quan
    const { categoryId, amenityIds, imageUrls, ...postData } = updatePostDto;

    // Cập nhật các trường thông tin cơ bản
    Object.assign(post, postData);

    // Cập nhật Category
    if (categoryId) {
      const category = await this.categoryRepository.findOneBy({
        id: categoryId,
      });
      if (!category) {
        throw new NotFoundException('Không tìm thấy loại phòng');
      }
      post.category = category;
    }

    // Cập nhật tiện ích
    if (amenityIds) {
      const amenities = await this.amenityRepository.findBy({
        id: In(amenityIds),
      });
      post.amenities = amenities;
    }

    // Cập nhật ảnh
    if (imageUrls) {
      const images = imageUrls.map((url) => {
        const img = new PostImageEntity();
        img.image_url = url;
        img.postId = post.id;
        return img;
      });
      post.images = images;
    }

    // Lưu thay đổi vào database
    return this.postRepository.save(post);
  }

  // Hàm xáo tin đăng theo ID
  async delete(id: number, user: any) {
    // Tìm tin đăng cần xóa
    const post = await this.postRepository.findOneBy({ id });
    if (!post) {
      throw new NotFoundException('Không tìm thấy tin đăng');
    }

    // Kiểm tra quyền: chỉ chủ trọ tạo tin đăng mới được xóa
    if (post.userId !== user.userId) {
      throw new ForbiddenException('Bạn không có quyền xóa tin đăng này');
    }

    // Xóa tin đăng
    await this.postRepository.remove(post);
    return { message: 'Xóa tin đăng thành công' };
  }
}

