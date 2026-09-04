import { routes } from '@blog/config';
import { service } from '@blog/service';
import { toMetadata } from '@web/metadata/to-metadata';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';

export const buildTagsMetadata = async (tenant: string): Promise<Metadata> => {
  const tenantContext = await getTenantSanityContext(tenant);
  const result = await service.pages.tagIndex.v1.getIndexPage(tenantContext);

  if (!result.ok) {
    logger.error('tags_metadata.fetch_failed', { error: result.error });
    return {};
  }

  if (!result.data) {
    return {};
  }

  const { seo } = result.data;

  return toMetadata(seo, { canonical: routes.tags(), ogType: 'website' });
};
