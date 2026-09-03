function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `invalidate-tenant-cache: missing required env var ${name}.`,
    );
  }
  return value;
}

export type TInvalidateCacheEnv = {
  webAppUrl: string;
  siteConfigRevalidateSecret: string;
  dryRun: boolean;
};

export function loadInvalidateCacheEnv(dryRun: boolean): TInvalidateCacheEnv {
  return {
    webAppUrl: requireEnv('WEB_APP_URL'),
    siteConfigRevalidateSecret: requireEnv('SITE_CONFIG_REVALIDATE_SECRET'),
    dryRun,
  };
}
