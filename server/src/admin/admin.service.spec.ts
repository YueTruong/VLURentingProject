import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mkdtemp, mkdir, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { AdminService } from './admin.service';
import { PostEntity } from 'src/database/entities/post.entity';
import { UserEntity } from 'src/database/entities/user.entity';
import { CategoryEntity } from 'src/database/entities/category.entity';
import { AmenityEntity } from 'src/database/entities/amenity.entity';
import { UserSettingsEntity } from 'src/database/entities/user-settings.entity';

describe('AdminService', () => {
  let service: AdminService;
  let tempDirectory: string | null = null;
  const configServiceMock = {
    get: jest.fn().mockReturnValue(''),
  };

  beforeEach(async () => {
    configServiceMock.get.mockReturnValue('');
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getRepositoryToken(PostEntity), useValue: {} },
        { provide: getRepositoryToken(UserEntity), useValue: {} },
        { provide: getRepositoryToken(UserSettingsEntity), useValue: {} },
        { provide: getRepositoryToken(CategoryEntity), useValue: {} },
        { provide: getRepositoryToken(AmenityEntity), useValue: {} },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  afterEach(async () => {
    if (tempDirectory) {
      await rm(tempDirectory, { recursive: true, force: true });
      tempDirectory = null;
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns direct urls without local resolution', async () => {
    await expect(
      service.resolveIdentityVerificationDocumentSource(
        'https://example.com/document.png',
      ),
    ).resolves.toEqual({
      kind: 'url',
      url: 'https://example.com/document.png',
    });
  });

  it('finds legacy files stored in nested upload folders', async () => {
    tempDirectory = await mkdtemp(join(tmpdir(), 'admin-service-'));
    const nestedDirectory = join(tempDirectory, 'identity', 'archive');
    const filePath = join(nestedDirectory, 'legacy-front.jpg');

    await mkdir(nestedDirectory, { recursive: true });
    await writeFile(filePath, 'test-image');

    (service as any).uploadsDirectory = tempDirectory;

    await expect(
      service.resolveIdentityVerificationDocumentSource('legacy-front.jpg'),
    ).resolves.toEqual({
      kind: 'file',
      path: filePath,
    });
  });
});
