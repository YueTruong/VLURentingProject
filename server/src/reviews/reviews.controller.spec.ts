import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

describe('ReviewsController', () => {
  let controller: ReviewsController;
  let reviewsService: {
    delete: jest.Mock;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewsController],
      providers: [
        {
          provide: ReviewsService,
          useValue: {
            findLatest: jest.fn(),
            findByUserId: jest.fn(),
            findByPostId: jest.fn(),
            findForAdmin: jest.fn(),
            delete: jest.fn(),
            deleteForAdmin: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ReviewsController>(ReviewsController);
    reviewsService = module.get(ReviewsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates deleting a review to the service with the authenticated user', async () => {
    await controller.delete('18', { user: { userId: 7 } });

    expect(reviewsService.delete).toHaveBeenCalledWith(18, { userId: 7 });
  });
});
