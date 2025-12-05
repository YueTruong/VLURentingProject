import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from 'src/database/entities/post.entity';
import { CategoryEntity } from 'src/database/entities/category.entity';
import { AmenityEntity } from 'src/database/entities/amenity.entity';
import { PostImageEntity } from 'src/database/entities/post-image.entity';

@Module({
  imports: [
    // Đăng ký các Entities mà Module này sẽ sử dụng
    TypeOrmModule.forFeature([
      PostEntity,
      CategoryEntity,
      AmenityEntity,
      PostImageEntity,
    ]),
  ],
  providers: [PostsService],
  controllers: [PostsController],
})
export class PostsModule {}
