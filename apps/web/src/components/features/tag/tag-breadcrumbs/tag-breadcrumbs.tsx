import { routes } from '@blog/config';
import {
  Breadcrumbs,
  type IBreadcrumbItem,
} from '@blog/ui/components/molecules/breadcrumbs';
import { BreadcrumbBar } from '@web/components/shared/breadcrumb-bar';
import { JsonLd } from '@web/components/shared/json-ld';
import { SmartLink } from '@web/components/shared/smart-link';
import { getHomeBreadcrumb } from '@web/server/site-settings/get-home-breadcrumb/get-home-breadcrumb';
import { getTagPage } from '@web/server/tag/get-tag-page/get-tag-page';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { getTranslations } from 'next-intl/server';

export type TTagBreadcrumbsProps = {
  slug: string;
};

export const TagBreadcrumbs = async ({ slug }: TTagBreadcrumbsProps) => {
  const result = await getTagPage(slug);
  const page = guardPageLoaderResult(result, 'tag_breadcrumbs.fetch_failed', {
    slug,
  });
  const { tag } = page;

  const [homeBreadcrumb, t] = await Promise.all([
    getHomeBreadcrumb(),
    getTranslations('breadcrumbs'),
  ]);

  const breadcrumbTrail: IBreadcrumbItem[] = [
    homeBreadcrumb,
    { label: tag.title, href: routes.tag(slug) },
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
