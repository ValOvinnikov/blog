import { routes } from '@blog/config';
import {
  Breadcrumbs,
  type IBreadcrumbItem,
} from '@blog/ui/components/molecules/breadcrumbs';
import { BreadcrumbBar } from '@web/components/shared/breadcrumb-bar';
import { JsonLd } from '@web/components/shared/json-ld';
import { SmartLink } from '@web/components/shared/smart-link';
import { getLandingPage } from '@web/server/landing/get-landing-page/get-landing-page';
import { getRequestContext } from '@web/server/request-context/request-context';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { getTranslations } from 'next-intl/server';

export type TLandingBreadcrumbsProps = {
  slug: string;
};

export const LandingBreadcrumbs = async ({
  slug,
}: TLandingBreadcrumbsProps) => {
  const result = await getLandingPage(slug);
  const page = guardPageLoaderResult(
    result,
    'landing_breadcrumbs.fetch_failed',
    { slug },
  );
  const { headingBlock } = page;

  const [t, { metadataBase }] = await Promise.all([
    getTranslations('breadcrumbs'),
    getRequestContext(),
  ]);

  const breadcrumbTrail: IBreadcrumbItem[] = [
    { label: t('home'), href: routes.home() },
    { label: headingBlock.heading, href: routes.landingPage(slug) },
  ];
  const breadcrumbListSchema = buildBreadcrumbListSchema(
    breadcrumbTrail,
    metadataBase,
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
