import { ConfigService } from '@nestjs/config';

export function getRequiredConfig(
  configService: ConfigService,
  key: string,
): string {
  const value = configService.get<string>(key)?.trim();
  if (!value) {
    throw new Error(`${key} is not configured`);
  }

  return value;
}
