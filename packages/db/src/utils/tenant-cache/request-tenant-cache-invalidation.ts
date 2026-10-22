import { HTTP_METHOD } from '@blog/config';

const REVALIDATE_SITE_CONFIG_PATH = '/api/revalidate-site-config';
const TENANT_CACHE_INVALIDATION_TIMEOUT_MS = 30_000;

export async function requestTenantCacheInvalidation(input: {
  webAppUrl: string;
  secret: string;
  tenantId: string;
}): Promise<void> {
  const { webAppUrl, secret, tenantId } = input;
  const response = await fetch(
    new URL(REVALIDATE_SITE_CONFIG_PATH, webAppUrl),
    {
      method: HTTP_METHOD.POST,
      headers: { Authorization: `Bearer ${secret}` },
      body: JSON.stringify({ tenantId }),
      signal: AbortSignal.timeout(TENANT_CACHE_INVALIDATION_TIMEOUT_MS),
    },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `Tenant cache invalidation failed for tenant "${tenantId}": ${response.status} ${body}`,
    );
  }
}
