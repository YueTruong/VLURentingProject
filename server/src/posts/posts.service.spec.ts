import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostEntity } from 'src/database/entities/post.entity';
import { CategoryEntity } from 'src/database/entities/category.entity';
import { AmenityEntity } from 'src/database/entities/amenity.entity';
import { SavedPostEntity } from 'src/database/entities/saved-post.entity';
import { NotificationsService } from 'src/notifications/notifications.service';

describe('PostsService', () => {
  let service: PostsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: getRepositoryToken(PostEntity), useValue: {} },
        { provide: getRepositoryToken(CategoryEntity), useValue: {} },
        { provide: getRepositoryToken(AmenityEntity), useValue: {} },
        { provide: getRepositoryToken(SavedPostEntity), useValue: {} },
        {
          provide: NotificationsService,
          useValue: { createNotification: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
