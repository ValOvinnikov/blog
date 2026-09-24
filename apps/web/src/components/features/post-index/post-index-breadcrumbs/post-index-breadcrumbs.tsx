import { routes } from '@blog/config';
import {
  Breadcrumbs,
  type IBreadcrumbItem,
} from '@blog/ui/components/molecules/breadcrumbs';
import { BreadcrumbBar } from '@web/components/shared/breadcrumb-bar';
import { JsonLd } from '@web/components/shared/json-ld';
import { SmartLink } from '@web/components/shared/smart-link';
import { getTenantBaseUrl } from '@web/server/tenant/get-tenant-base-url';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { getTranslations } from 'next-intl/server';

export type TPostIndexBreadcrumbsProps = {
  tenant: string;
};

export const PostIndexBreadcrumbs = async ({
  tenant,
}: TPostIndexBreadcrumbsProps) => {
  const [t, siteUrl] = await Promise.all([
    getTranslations('breadcrumbs'),
    getTenantBaseUrl(tenant),
  ]);

  const breadcrumbTrail: IBreadcrumbItem[] = [
    { label: t('home'), href: routes.home() },
    { label: t('blog'), href: routes.blogIndex() },
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
