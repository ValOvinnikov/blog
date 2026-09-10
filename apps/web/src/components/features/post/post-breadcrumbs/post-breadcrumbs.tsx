import { routes } from '@blog/config';
import {
  Breadcrumbs,
  type IBreadcrumbItem,
} from '@blog/ui/molecules/breadcrumbs';
import { BreadcrumbBar } from '@web/components/shared/breadcrumb-bar';
import { JsonLd } from '@web/components/shared/json-ld';
import { SmartLink } from '@web/components/shared/smart-link';
import { getPostPage } from '@web/server/post/get-post-page';
import { getTenantBaseUrl } from '@web/server/tenant/get-tenant-base-url';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { getTranslations } from 'next-intl/server';

export type TPostBreadcrumbsProps = {
  slug: string;
  tenant: string;
};

/**
 * PostBreadcrumbs — the post detail's Home › Topic › Post trail, rendered
 * alongside its `BreadcrumbList` JSON-LD. Fetches the cached post and its
 * own `breadcrumbs` copy.
 */
export const PostBreadcrumbs = async ({
  slug,
  tenant,
}: TPostBreadcrumbsProps) => {
  const result = await getPostPage(slug, tenant);
  const post = guardPageLoaderResult(result, 'post_breadcrumbs.fetch_failed', {
    slug,
  });
  const { title, topic } = post;

  const [t, siteUrl] = await Promise.all([
    getTranslations('breadcrumbs'),
    getTenantBaseUrl(tenant),
  ]);

  const breadcrumbTrail: IBreadcrumbItem[] = [
    { label: t('home'), href: routes.home() },
    { label: topic.title, href: routes.topic(topic.slug) },
    { label: title, href: routes.post(slug) },
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
