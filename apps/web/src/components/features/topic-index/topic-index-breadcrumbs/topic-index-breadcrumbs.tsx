import { routes } from '@blog/config';
import {
  Breadcrumbs,
  type IBreadcrumbItem,
} from '@blog/ui/components/molecules/breadcrumbs';
import { BreadcrumbBar } from '@web/components/shared/breadcrumb-bar';
import { JsonLd } from '@web/components/shared/json-ld';
import { SmartLink } from '@web/components/shared/smart-link';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { getTranslations } from 'next-intl/server';

export const TopicIndexBreadcrumbs = async () => {
  const t = await getTranslations('breadcrumbs');

  const breadcrumbTrail: IBreadcrumbItem[] = [
    { label: t('home'), href: routes.home() },
    { label: t('topics'), href: routes.topics() },
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
