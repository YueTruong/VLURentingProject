import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from 'src/database/entities/post.entity';
import { UserEntity } from 'src/database/entities/user.entity';
import { UserProfileEntity } from 'src/database/entities/user-profile.entity';
import { CategoryEntity } from 'src/database/entities/category.entity';
import { AmenityEntity } from 'src/database/entities/amenity.entity';

@Module({
  imports: [
    // Đăng ký PostEntity để AdminService có thể 'Inject'
    TypeOrmModule.forFeature([PostEntity, UserEntity, UserProfileEntity, CategoryEntity, AmenityEntity]),
  ],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
