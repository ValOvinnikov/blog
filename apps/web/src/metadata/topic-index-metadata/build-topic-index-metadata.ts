import { routes } from '@blog/config';
import { toMetadata } from '@web/metadata/to-metadata';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { getTopicIndexPage } from '@web/server/topic-index/get-topic-index-page';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';

export const buildTopicIndexMetadata = async (
  tenant: string,
): Promise<Metadata> => {
  const [result, tenantContext] = await Promise.all([
    getTopicIndexPage(tenant),
    getTenantSanityContext(tenant),
  ]);

  if (!result.ok) {
    logger.error('topic_index_metadata.fetch_failed', { error: result.error });
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
