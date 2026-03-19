import { ConfigService } from '@nestjs/config';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
];

function parseAllowedOrigins(rawOrigins?: string | null): string[] {
  const parsedOrigins = rawOrigins
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const allowedOrigins =
    parsedOrigins && parsedOrigins.length > 0
      ? Array.from(new Set(parsedOrigins))
      : DEFAULT_ALLOWED_ORIGINS;

  if (allowedOrigins.includes('*')) {
    throw new Error('ALLOWED_ORIGINS must not contain "*" when credentials are enabled');
  }

  return allowedOrigins;
}

export function getAllowedOrigins(configService: ConfigService): string[] {
  return parseAllowedOrigins(configService.get<string>('ALLOWED_ORIGINS'));
}

function buildOriginMatcher(allowedOrigins: string[]) {
  return (
    origin: string | undefined,
    callback: (error: Error | null, allow?: boolean) => void,
  ) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  };
}

export function buildHttpCorsOptions(
  configService: ConfigService,
): CorsOptions {
  const allowedOrigins = getAllowedOrigins(configService);

  return {
    origin: buildOriginMatcher(allowedOrigins),
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  };
}

export function buildSocketCorsOptions(configService: ConfigService) {
  const allowedOrigins = getAllowedOrigins(configService);

  return {
    origin: buildOriginMatcher(allowedOrigins),
    credentials: true,
  };
}
