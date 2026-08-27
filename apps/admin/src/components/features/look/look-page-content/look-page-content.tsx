import { LookForm } from '@admin/components/features/look/look-form';
import {
  defaultLookFormValues,
  toLookFormValues,
} from '@admin/utils/default-look-values/default-look-values';
import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';

export type TLookPageContentProps = {
  tenant: TTenant;
};

/**
 * The Look tab's data-fetch + render, shared by `/tenants/[tenantId]/look` and
 * the slug-free `/dashboard/look` — both resolve a `TTenant` however fits
 * their own routing (URL param vs. session membership) and hand it here.
 */
export const LookPageContent = async ({ tenant }: TLookPageContentProps) => {
  const siteConfig = await queries.siteConfig.getSiteConfig(tenant.id);

  const initialValues = siteConfig
    ? toLookFormValues(siteConfig)
    : defaultLookFormValues();

  return <LookForm tenantSlug={tenant.slug} initialValues={initialValues} />;
};
