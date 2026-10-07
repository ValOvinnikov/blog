import { routes } from '@blog/config';
import {
  Breadcrumbs,
  type IBreadcrumbItem,
} from '@blog/ui/components/molecules/breadcrumbs';
import { BreadcrumbBar } from '@web/components/shared/breadcrumb-bar';
import { JsonLd } from '@web/components/shared/json-ld';
import { SmartLink } from '@web/components/shared/smart-link';
import { getPostIndexPage } from '@web/server/post-index/get-post-index-page/get-post-index-page';
import { getHomeBreadcrumb } from '@web/server/site-settings/get-home-breadcrumb/get-home-breadcrumb';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { getTranslations } from 'next-intl/server';

export const PostIndexBreadcrumbs = async () => {
  const [result, homeBreadcrumb, t] = await Promise.all([
    getPostIndexPage(),
    getHomeBreadcrumb(),
    getTranslations('breadcrumbs'),
  ]);
  const { headingBlock } = guardPageLoaderResult(
    result,
    'post_index_breadcrumbs.fetch_failed',
  );

  const breadcrumbTrail: IBreadcrumbItem[] = [
    homeBreadcrumb,
    { label: headingBlock.heading, href: routes.blogIndex() },
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
