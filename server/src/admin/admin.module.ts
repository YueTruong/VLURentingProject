import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AmenityEntity } from 'src/database/entities/amenity.entity';
import { BookingEntity } from 'src/database/entities/booking.entity';
import { CategoryEntity } from 'src/database/entities/category.entity';
import { PostEntity } from 'src/database/entities/post.entity';
import { ReviewEntity } from 'src/database/entities/review.entity';
import { UserProfileEntity } from 'src/database/entities/user-profile.entity';
import { UserSettingsEntity } from 'src/database/entities/user-settings.entity';
import { UserEntity } from 'src/database/entities/user.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PostEntity,
      UserEntity,
      UserProfileEntity,
      UserSettingsEntity,
      CategoryEntity,
      AmenityEntity,
      BookingEntity,
      ReviewEntity,
    ]),
  ],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
