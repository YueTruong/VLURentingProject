import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReviewsService } from './reviews.service';
import { ReviewEntity } from 'src/database/entities/review.entity';
import { PostEntity } from 'src/database/entities/post.entity';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let reviewRepository: {
    findOne: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    reviewRepository = {
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: getRepositoryToken(ReviewEntity), useValue: reviewRepository },
        { provide: getRepositoryToken(PostEntity), useValue: {} },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects deleting a review with invalid id', async () => {
    await expect(service.delete(0, { userId: 5 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects deleting a review owned by another user', async () => {
    reviewRepository.findOne.mockResolvedValue({
      id: 4,
      userId: 99,
    });

    await expect(service.delete(4, { userId: 5 })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects deleting a missing review', async () => {
    reviewRepository.findOne.mockResolvedValue(null);

    await expect(service.delete(10, { userId: 5 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deletes a review owned by the current user', async () => {
    const review = { id: 11, userId: 5 };
    reviewRepository.findOne.mockResolvedValue(review);

    const result = await service.delete(11, { userId: 5 });

    expect(reviewRepository.findOne).toHaveBeenCalledWith({
      where: { id: 11 },
    });
    expect(reviewRepository.remove).toHaveBeenCalledWith(review);
    expect(result).toEqual({ success: true, deletedId: 11 });
  });
});
