import { routes } from '@blog/config';
import { toMetadata } from '@web/metadata/to-metadata';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { getTopicPage } from '@web/server/topic/get-topic-page';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

/**
 * Every page self-canonicalizes — page 2+ must never canonical to
 * `/topics/[slug]`.
 */
export const buildTopicMetadata = async (
  slug: string,
  tenant: string,
  pageNumber?: number,
): Promise<Metadata> => {
  const [result, t, tenantContext] = await Promise.all([
    getTopicPage(slug, tenant),
    getTranslations('pagination'),
    getTenantSanityContext(tenant),
  ]);

  if (!result.ok) {
    logger.error('topic_metadata.fetch_failed', {
      slug,
      error: result.error,
    });
    return {};
  }

  if (!result.data) {
    return {};
  }

  const { seo } = result.data;
  const resolvedSeo =
    pageNumber === undefined
      ? seo
      : {
          ...seo,
          title: `${seo.title} ${t('pageSuffix', { page: pageNumber })}`,
          ogTitle: seo.ogTitle
            ? `${seo.ogTitle} ${t('pageSuffix', { page: pageNumber })}`
            : undefined,
        };

  return toMetadata(resolvedSeo, tenantContext, {
    canonical: routes.topic(slug, pageNumber),
    ogType: 'website',
  });
};
