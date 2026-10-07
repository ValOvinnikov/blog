import { routes } from '@blog/config';
import {
  Breadcrumbs,
  type IBreadcrumbItem,
} from '@blog/ui/components/molecules/breadcrumbs';
import { BreadcrumbBar } from '@web/components/shared/breadcrumb-bar';
import { JsonLd } from '@web/components/shared/json-ld';
import { SmartLink } from '@web/components/shared/smart-link';
import { getHomeBreadcrumb } from '@web/server/site-settings/get-home-breadcrumb/get-home-breadcrumb';
import { getTagIndexPage } from '@web/server/tag-index/get-tag-index-page/get-tag-index-page';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { getTranslations } from 'next-intl/server';

export const TagIndexBreadcrumbs = async () => {
  const [result, homeBreadcrumb, t] = await Promise.all([
    getTagIndexPage(),
    getHomeBreadcrumb(),
    getTranslations('breadcrumbs'),
  ]);
  const { headingBlock } = guardPageLoaderResult(
    result,
    'tag_index_breadcrumbs.fetch_failed',
  );

  const breadcrumbTrail: IBreadcrumbItem[] = [
    homeBreadcrumb,
    { label: headingBlock.heading, href: routes.tags() },
  ];
  const breadcrumbListSchema = await buildBreadcrumbListSchema(breadcrumbTrail);

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
