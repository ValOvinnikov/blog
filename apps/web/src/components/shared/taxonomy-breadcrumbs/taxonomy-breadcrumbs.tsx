import {
  Breadcrumbs,
  type IBreadcrumbItem,
} from '@shinefold/ui/components/molecules/breadcrumbs';
import { BreadcrumbBar } from '@web/components/shared/breadcrumb-bar';
import { JsonLd } from '@web/components/shared/json-ld';
import { SmartLink } from '@web/components/shared/smart-link';
import { getHomeBreadcrumb } from '@web/server/site-settings/get-home-breadcrumb/get-home-breadcrumb';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { getTranslations } from 'next-intl/server';

interface ITaxonomyBreadcrumbsProps {
  term: IBreadcrumbItem;
  isAbovePageHeading?: boolean;
}

export const TaxonomyBreadcrumbs = async ({
  term,
  isAbovePageHeading,
}: ITaxonomyBreadcrumbsProps) => {
  const [homeBreadcrumb, t] = await Promise.all([
    getHomeBreadcrumb(),
    getTranslations('breadcrumbs'),
  ]);

  const breadcrumbTrail: IBreadcrumbItem[] = [homeBreadcrumb, term];
  const breadcrumbListSchema = await buildBreadcrumbListSchema(breadcrumbTrail);

  return (
    <>
      {breadcrumbListSchema && <JsonLd schema={breadcrumbListSchema} />}
      <BreadcrumbBar isAbovePageHeading={isAbovePageHeading}>
        <Breadcrumbs
          items={breadcrumbTrail}
          ariaLabel={t('ariaLabel')}
          linkAs={SmartLink}
        />
      </BreadcrumbBar>
    </>
  );
};
