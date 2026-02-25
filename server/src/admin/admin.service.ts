import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from 'src/database/entities/post.entity';
import { Not, Repository, FindManyOptions } from 'typeorm';
import { UpdatePostStatusDto } from './dto/update-post-status.dto';
import { UserEntity } from 'src/database/entities/user.entity';
import { UserProfileEntity } from 'src/database/entities/user-profile.entity';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { CategoryEntity } from 'src/database/entities/category.entity';
import { AmenityEntity } from 'src/database/entities/amenity.entity';
import { ManageCategoryDto } from './dto/manage-category.dto';
import { ManageAmenityDto } from './dto/manage-amenity.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,

    @InjectRepository(AmenityEntity)
    private readonly amenityRepository: Repository<AmenityEntity>,
  ) {}

  // Lấy tất cả bài đăng (cho Admin xem)
  async getAllPosts(status?: string) {
    // Thiết lập tùy chọn truy vấn
    const options: FindManyOptions<PostEntity> = {
      order: { createdAt: 'DESC' },
      relations: ['user', 'user.profile', 'category', 'images', 'amenities'],
    };

    // Nếu có lọc trạng thái, thêm vào điều kiện where
    if (status) {
      options.where = { status: status as any };
    }

    // Thực hiện truy vấn
    const posts = await this.postRepository.find(options);

    // Xóa thông tin nhạy cảm của chủ trọ
    return posts.map((post) => {
      if (post.user) {
        delete post.user.password_hash;
      }
      return post;
    });
  }

  // Cập nhật trạng thái tin đăng
  async updatePostStatus(id: number, updatePostStatusDto: UpdatePostStatusDto) {
    // Tìm bài đăng
    const post = await this.postRepository.findOneBy({ id });
    if (!post) {
      throw new NotFoundException('Không tìm thấy tin đăng');
    }

    // Cập nhật trạng thái
    const nextStatus = updatePostStatusDto.status;
    const rejectionReason = updatePostStatusDto.rejectionReason?.trim();

    if (nextStatus === 'rejected') {
      if (!rejectionReason) {
        throw new BadRequestException('Vui lòng nhập lý do từ chối');
      }
      post.rejectionReason = rejectionReason;
      post.resubmittedAt = null;
    } else {
      post.rejectionReason = null;
      post.resubmittedAt = null;
    }

    post.status = nextStatus;

    // Lưu lại
    return this.postRepository.save(post);
  }

  // Lấy tất cả user trừ admin
  async getAllUsers() {
    // Tìm tất cả user, kèm role và profile
    const users = await this.userRepository.find({
      relations: ['role', 'profile'],
      where: {
        // Loại trừ user có role 'admin'
        role: {
          name: Not('admin'),
        },
      },
      order: {
        createdAt: 'DESC',
      },
    });

    // Xóa thông tin nhạy cảm
    return users.map((user) => {
      const { password_hash, ...result } = user;
      return result;
    });
  }

  // Hàm cập nhật trạng thái user
  async updateUserStatus(id: number, updateUserStatusDto: UpdateUserStatusDto) {
    // TÌm user theo ID, lấy kèm role
    const user = await this.userRepository.findOne({
      where: { id: id },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // Ngăn chặn thay đổi trạng thái của admin
    if (user.role.name === 'admin') {
      throw new ForbiddenException(
        'Bạn không có quyền thay đổi trạng thái của tài khoản Admin',
      );
    }

    // Cập nhật trạng thái is_active
    user.is_active = updateUserStatusDto.is_active;

    // Lưu lại thay đổi
    const savedUser = await this.userRepository.save(user);

    // Xóa thông tin nhạy cảm trước khi trả về
    const { password_hash, ...result } = savedUser;
    return result;
  }

  async getAllCategories() {
    return this.categoryRepository.find({ order: { id: 'ASC' } });
  }

  async createCategory(payload: ManageCategoryDto) {
    const normalizedName = payload.name.trim();
    if (!normalizedName) {
      throw new BadRequestException('Tên danh mục không hợp lệ');
    }

    const existed = await this.categoryRepository.findOne({ where: { name: normalizedName } });
    if (existed) {
      throw new BadRequestException('Danh mục đã tồn tại');
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
      throw new NotFoundException('Không tìm thấy danh mục');
    }

    const normalizedName = payload.name.trim();
    if (!normalizedName) {
      throw new BadRequestException('Tên danh mục không hợp lệ');
    }

    const existed = await this.categoryRepository.findOne({ where: { name: normalizedName } });
    if (existed && existed.id !== id) {
      throw new BadRequestException('Danh mục đã tồn tại');
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
      throw new NotFoundException('Không tìm thấy danh mục');
    }

    if (category.posts && category.posts.length > 0) {
      throw new BadRequestException('Danh mục đang được sử dụng bởi tin đăng');
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
      throw new BadRequestException('Tên tiện ích không hợp lệ');
    }

    const existed = await this.amenityRepository.findOne({ where: { name: normalizedName } });
    if (existed) {
      throw new BadRequestException('Tiện ích đã tồn tại');
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
      throw new NotFoundException('Không tìm thấy tiện ích');
    }

    const normalizedName = payload.name.trim();
    if (!normalizedName) {
      throw new BadRequestException('Tên tiện ích không hợp lệ');
    }

    const existed = await this.amenityRepository.findOne({ where: { name: normalizedName } });
    if (existed && existed.id !== id) {
      throw new BadRequestException('Tiện ích đã tồn tại');
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
      throw new NotFoundException('Không tìm thấy tiện ích');
    }

    if (amenity.posts && amenity.posts.length > 0) {
      throw new BadRequestException('Tiện ích đang được sử dụng bởi tin đăng');
    }

    await this.amenityRepository.remove(amenity);
    return { success: true, deletedId: id };
  }
}
