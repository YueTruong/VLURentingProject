import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';

describe('AiService', () => {
  let service: AiService;

  const createConfig = (overrides: Record<string, string | undefined>) => ({
    get: (key: string) => overrides[key],
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: ConfigService,
          useValue: createConfig({}),
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('should return fallback when OPENAI_API_KEY missing', async () => {
    const result = await service.parseHousingQuery('tim phong gan CS1');

    expect(result.provider).toBe('fallback');
    expect(result.criteria).toBeNull();
    expect(result.reply).toContain('fallback');
  });

  it('should sanitize criteria from AI response', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch' as any).mockResolvedValue({
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
                  district: 'Quận 7',
                  type: 'Phòng trọ',
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
      text: async () => '',
    } as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: ConfigService,
          useValue: createConfig({ OPENAI_API_KEY: 'x', OPENAI_MODEL: 'gpt-test' }),
        },
      ],
    }).compile();

    const localService = module.get<AiService>(AiService);
    const result = await localService.parseHousingQuery('tim phong');

    expect(result.provider).toBe('gpt-test');
    expect(result.criteria).toMatchObject({
      priceMin: 2,
      priceMax: 5,
      areaMin: 20,
      areaMax: 40,
      bedsMin: 2,
      campus: 'CS2',
      availability: 'available',
      district: 'Quận 7',
      type: 'Phòng trọ',
      query: 'gan truong',
      furnished: true,
      parking: true,
      tags: ['Wifi'],
    });

    fetchSpy.mockRestore();
  });
});
