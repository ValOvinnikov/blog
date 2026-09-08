import { routes } from '@blog/config';
import {
  Breadcrumbs,
  type IBreadcrumbItem,
} from '@blog/ui/molecules/breadcrumbs';
import { BreadcrumbBar } from '@web/components/shared/breadcrumb-bar';
import { JsonLd } from '@web/components/shared/json-ld';
import { SmartLink } from '@web/components/shared/smart-link';
import { getTenantBaseUrl } from '@web/server/tenant/get-tenant-base-url';
import { getTopicPage } from '@web/server/topic/get-topic-page';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { getTranslations } from 'next-intl/server';

export type TTopicBreadcrumbsProps = {
  slug: string;
  tenant: string;
};

/**
 * TopicBreadcrumbs — the topic archive's Home › {topic} trail, rendered
 * alongside its `BreadcrumbList` JSON-LD. Fetches the cached page and its
 * own `breadcrumbs` copy.
 */
export const TopicBreadcrumbs = async ({
  slug,
  tenant,
}: TTopicBreadcrumbsProps) => {
  const result = await getTopicPage(slug, tenant);
  const page = guardPageLoaderResult(result, 'topic_breadcrumbs.fetch_failed', {
    slug,
  });
  const { topic } = page;

  const [t, siteUrl] = await Promise.all([
    getTranslations('breadcrumbs'),
    getTenantBaseUrl(tenant),
  ]);

  const breadcrumbTrail: IBreadcrumbItem[] = [
    { label: t('home'), href: routes.home() },
    { label: topic.title, href: routes.topic(slug) },
  ];
  const breadcrumbListSchema = buildBreadcrumbListSchema(
    breadcrumbTrail,
    siteUrl ?? '',
  );

  return (
    <>
      {breadcrumbListSchema && <JsonLd schema={breadcrumbListSchema} />}
      <BreadcrumbBar>
        <Breadcrumbs
          items={breadcrumbTrail}
          ariaLabel={t('ariaLabel')}
          linkAs={SmartLink}
        />
      </BreadcrumbBar>
    </>
  );
};
