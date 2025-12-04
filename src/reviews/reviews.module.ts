import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewEntity } from 'src/database/entities/review.entity';
import { PostEntity } from 'src/database/entities/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ReviewEntity, PostEntity])],
  providers: [ReviewsService],
  controllers: [ReviewsController],
})
export class ReviewsModule {}
