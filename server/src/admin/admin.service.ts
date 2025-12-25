import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from 'src/database/entities/post.entity';
import { Not, Repository, FindManyOptions } from 'typeorm';
import { UpdatePostStatusDto } from './dto/update-post-status.dto';
import { UserEntity } from 'src/database/entities/user.entity';
import { UserProfileEntity } from 'src/database/entities/user-profile.entity';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  // Lấy tất cả bài đăng (cho Admin xem)
  async getAllPosts(status?: string) {
    // Thiết lập tùy chọn truy vấn
    const options: FindManyOptions<PostEntity> = {
      order: { createdAt: 'DESC' },
      relations: ['user', 'user.profile', 'category'],
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
  async updatePostStatus(
    id: number,
    updatePostStatusDto: UpdatePostStatusDto,
  ) {
    // Tìm bài đăng
    const post = await this.postRepository.findOneBy({ id });
    if (!post) {
      throw new NotFoundException('Không tìm thấy tin đăng');
    }

    // Cập nhật trạng thái
    post.status = updatePostStatusDto.status;

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
  async updateUserStatus(
    id: number,
    updateUserStatusDto: UpdateUserStatusDto,
  ) {
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
      throw new ForbiddenException('Bạn không có quyền thay đổi trạng thái của tài khoản Admin');
    }

    // Cập nhật trạng thái is_active
    user.is_active = updateUserStatusDto.is_active;

    // Lưu lại thay đổi
    const savedUser = await this.userRepository.save(user);

    // Xóa thông tin nhạy cảm trước khi trả về
    const { password_hash, ...result } = savedUser;
    return result;
  }
}
