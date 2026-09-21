import { routes } from '@blog/config';
import { toMetadata } from '@web/metadata/to-metadata';
import { getTagIndexPage } from '@web/server/tag-index/get-tag-index-page';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';

export const buildTagIndexMetadata = async (
  tenant: string,
): Promise<Metadata> => {
  const [result, tenantContext] = await Promise.all([
    getTagIndexPage(tenant),
    getTenantSanityContext(tenant),
  ]);

  if (!result.ok) {
    logger.error('tag_index_metadata.fetch_failed', { error: result.error });
    return {};
  }

  if (!result.data) {
    return {};
  }

  const { seo } = result.data;

  return toMetadata(seo, tenantContext, {
    canonical: routes.tags(),
    ogType: 'website',
  });
};
