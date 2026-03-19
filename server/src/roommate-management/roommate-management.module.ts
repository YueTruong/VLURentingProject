import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryEntity } from 'src/database/entities/category.entity';
import { PostEntity } from 'src/database/entities/post.entity';
import { RoommateRequestEntity } from 'src/database/entities/roommate-request.entity';
import { UserEntity } from 'src/database/entities/user.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { RoommateManagementController } from './roommate-management.controller';
import { RoommateManagementService } from './roommate-management.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoommateRequestEntity,
      PostEntity,
      UserEntity,
      CategoryEntity,
    ]),
    NotificationsModule,
  ],
  controllers: [RoommateManagementController],
  providers: [RoommateManagementService],
})
export class RoommateManagementModule {}
