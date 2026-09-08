import { routes } from '@blog/config';
import {
  Breadcrumbs,
  type IBreadcrumbItem,
} from '@blog/ui/molecules/breadcrumbs';
import { BreadcrumbBar } from '@web/components/shared/breadcrumb-bar';
import { JsonLd } from '@web/components/shared/json-ld';
import { SmartLink } from '@web/components/shared/smart-link';
import { getTagPage } from '@web/server/tag/get-tag-page';
import { getTenantBaseUrl } from '@web/server/tenant/get-tenant-base-url';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { getTranslations } from 'next-intl/server';

export type TTagBreadcrumbsProps = {
  slug: string;
  tenant: string;
};

/**
 * TagBreadcrumbs — the tag archive's Home › {tag} trail, rendered
 * alongside its `BreadcrumbList` JSON-LD. Fetches the cached page and its
 * own `breadcrumbs` copy.
 */
export const TagBreadcrumbs = async ({
  slug,
  tenant,
}: TTagBreadcrumbsProps) => {
  const result = await getTagPage(slug, tenant);
  const page = guardPageLoaderResult(result, 'tag_breadcrumbs.fetch_failed', {
    slug,
  });
  const { tag } = page;

  const [t, siteUrl] = await Promise.all([
    getTranslations('breadcrumbs'),
    getTenantBaseUrl(tenant),
  ]);

  const breadcrumbTrail: IBreadcrumbItem[] = [
    { label: t('home'), href: routes.home() },
    { label: tag.title, href: routes.tag(slug) },
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
