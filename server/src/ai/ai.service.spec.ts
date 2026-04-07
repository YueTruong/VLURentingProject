import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiService } from './ai.service';
import { PostEntity } from 'src/database/entities/post.entity';

describe('AiService', () => {
  let service: AiService;

  const createConfig = (overrides: Record<string, string | undefined>) => ({
    get: (key: string) => overrides[key],
  });

  const createPostRepository = () => ({
    count: jest.fn().mockResolvedValue(0),
    find: jest.fn().mockResolvedValue([]),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: ConfigService,
          useValue: createConfig({}),
        },
        {
          provide: getRepositoryToken(PostEntity),
          useValue: createPostRepository(),
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return fallback status when no cloud provider is configured', () => {
    const status = service.getStatus();

    expect(status.cloudAvailable).toBe(false);
    expect(status.provider).toBe('fallback');
    expect(status.message).toContain('OPENAI_API_KEY');
  });

  it('should return fallback when no cloud provider is configured', async () => {
    const result = await service.parseHousingQuery('tim phong gan CS1');

    expect(result.provider).toBe('fallback');
    expect(result.criteria).toBeNull();
    expect(result.mode).toBe('fallback');
    expect(result.reply).toContain('AI cloud tạm thời chưa sẵn sàng');
  });

  it('should prefer dialogflow when AI_PROVIDER is dialogflow and webhook is configured', async () => {
    jest.spyOn(global, 'fetch' as never).mockResolvedValue({
      ok: true,
      json: async () => ({
        criteria: { priceMax: 6, campus: 'CS1' },
        reply: 'dialogflow-ok',
      }),
    } as never);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: ConfigService,
          useValue: createConfig({
            DIALOGFLOW_WEBHOOK_URL: 'https://dialogflow-gateway.local',
            AI_PROVIDER: 'dialogflow',
          }),
        },
        {
          provide: getRepositoryToken(PostEntity),
          useValue: createPostRepository(),
        },
      ],
    }).compile();

    const localService = module.get<AiService>(AiService);
    const result = await localService.parseHousingQuery('tim phong duoi 6 trieu');

    expect(result.provider).toBe('dialogflow');
    expect(result.criteria).toMatchObject({ priceMax: 6, campus: 'CS1' });
    expect(result.reply).toBe('dialogflow-ok');
    expect(result.mode).toBe('cloud');
  });

  it('should sanitize criteria from openai response', async () => {
    jest.spyOn(global, 'fetch' as never).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                criteria: {
                  priceMin: 2,
                  priceMax: 5,
                  areaMin: 20,
                  areaMax: 40,
                  bedsMin: 2,
                  campus: 'CS2',
                  availability: 'available',
                  district: 'Quan 7',
                  type: 'Phong tro',
                  query: 'gan truong',
                  tags: ['Wifi', '  ', 123],
                  furnished: true,
                  parking: true,
                },
                reply: 'ok',
              }),
            },
          },
        ],
      }),
    } as never);

    const postRepository = createPostRepository();
    postRepository.count.mockResolvedValue(2);
    postRepository.find.mockResolvedValue([
      {
        id: 1,
        title: 'Phong tro gan truong',
        price: 3500000,
        area: 24,
        address: '123 Duong ABC, Binh Thanh, Ho Chi Minh',
        campus: 'CS1',
        availability: 'available',
        updatedAt: new Date(),
        category: { name: 'Phong tro' },
        amenities: [{ name: 'Wifi' }],
      },
    ]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: ConfigService,
          useValue: createConfig({
            OPENAI_API_KEY: 'x',
            OPENAI_MODEL: 'gpt-test',
            AI_PROVIDER: 'openai',
          }),
        },
        {
          provide: getRepositoryToken(PostEntity),
          useValue: postRepository,
        },
      ],
    }).compile();

    const localService = module.get<AiService>(AiService);
    const result = await localService.parseHousingQuery('tim phong');

    expect(result.provider).toBe('gpt-test');
    expect(result.mode).toBe('cloud');
    expect(result.criteria).toMatchObject({
      priceMin: 2,
      priceMax: 5,
      areaMin: 20,
      areaMax: 40,
      bedsMin: 2,
      campus: 'CS2',
      availability: 'available',
      district: 'Quan 7',
      type: 'Phong tro',
      query: 'gan truong',
      furnished: true,
      parking: true,
      tags: ['Wifi'],
    });
  });
});
