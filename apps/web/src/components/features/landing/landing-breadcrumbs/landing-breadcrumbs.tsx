import { routes } from '@blog/config';
import {
  Breadcrumbs,
  type IBreadcrumbItem,
} from '@blog/ui/components/molecules/breadcrumbs';
import { BreadcrumbBar } from '@web/components/shared/breadcrumb-bar';
import { JsonLd } from '@web/components/shared/json-ld';
import { SmartLink } from '@web/components/shared/smart-link';
import { getLandingPage } from '@web/server/landing/get-landing-page/get-landing-page';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { getTranslations } from 'next-intl/server';

export type TLandingBreadcrumbsProps = { path: string };

export const LandingBreadcrumbs = async ({
  path,
}: TLandingBreadcrumbsProps) => {
  const result = await getLandingPage(path);
  const page = guardPageLoaderResult(
    result,
    'landing_breadcrumbs.fetch_failed',
    { path },
  );
  const { headingBlock, sectionNavigation } = page;

  const t = await getTranslations('breadcrumbs');

  const pageTrail: IBreadcrumbItem[] = sectionNavigation
    ? sectionNavigation.breadcrumbs.map((breadcrumb) => ({
        label: breadcrumb.title,
        href: routes.landingPage(breadcrumb.path),
      }))
    : [{ label: headingBlock.heading, href: routes.landingPage(path) }];
  const breadcrumbTrail: IBreadcrumbItem[] = [
    { label: t('home'), href: routes.home() },
    ...pageTrail,
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
