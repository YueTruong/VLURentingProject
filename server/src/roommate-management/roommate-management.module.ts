import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from '../database/entities/post.entity';
import { RoommateManagementController } from './roommate-management.controller';
import { RoommateManagementService } from './roommate-management.service';

@Module({
  imports: [TypeOrmModule.forFeature([PostEntity])],
  controllers: [RoommateManagementController],
  providers: [RoommateManagementService],
})
export class RoommateManagementModule {}
