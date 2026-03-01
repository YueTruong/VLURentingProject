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

  it('should set post status to pending after landlord updates approved post', async () => {
    const existingPost = {
      id: 11,
      userId: 7,
      status: 'approved',
      rejectionReason: null,
      resubmittedAt: null,
      title: 'old',
    } as unknown as PostEntity;

    const savedPost = { ...existingPost, status: 'pending' } as unknown as PostEntity;

    const postRepo = (service as any).postRepository;
    postRepo.findOneBy = jest.fn().mockResolvedValue(existingPost);
    postRepo.save = jest.fn().mockResolvedValue(savedPost);

    const result = await service.update(11, { title: 'new title' }, { userId: 7 });

    expect(postRepo.save).toHaveBeenCalled();
    expect((postRepo.save as jest.Mock).mock.calls[0][0].status).toBe('pending');
    expect(result.status).toBe('pending');
  });
});
