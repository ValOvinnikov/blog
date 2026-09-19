import { routes } from '@blog/config';
import { toMetadata } from '@web/metadata/to-metadata';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { getTopicsIndexPage } from '@web/server/topics-index/get-topics-index-page';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';

export const buildTopicsMetadata = async (
  tenant: string,
): Promise<Metadata> => {
  const [result, tenantContext] = await Promise.all([
    getTopicsIndexPage(tenant),
    getTenantSanityContext(tenant),
  ]);

  if (!result.ok) {
    logger.error('topics_metadata.fetch_failed', { error: result.error });
    return {};
  }

  if (!result.data) {
    return {};
  }

  const { seo } = result.data;

  return toMetadata(seo, tenantContext, {
    canonical: routes.topics(),
    ogType: 'website',
  });
};
