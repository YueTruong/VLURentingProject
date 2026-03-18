export function shouldUseSchemaSync(
  nodeEnv?: string | null,
  databaseUrl?: string | null,
): boolean {
  const isProd = (nodeEnv ?? 'development').trim().toLowerCase() === 'production';
  return !isProd && !databaseUrl;
}
