import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from 'src/database/entities/post.entity';
import { UserEntity } from 'src/database/entities/user.entity';
import { UserProfileEntity } from 'src/database/entities/user-profile.entity';

@Module({
  imports: [
    // Đăng ký PostEntity để AdminService có thể 'Inject'
    TypeOrmModule.forFeature([PostEntity, UserEntity, UserProfileEntity]),
  ],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
