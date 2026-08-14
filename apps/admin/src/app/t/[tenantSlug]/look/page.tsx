import { LookForm } from '@admin/components/look-form';
import { requireTenantMembership } from '@admin/server/auth/require-tenant-membership';
import {
  defaultLookFormValues,
  toLookFormValues,
} from '@admin/utils/default-look-values/default-look-values';
import { queries } from '@blog/db';

type TProps = {
  params: Promise<{ tenantSlug: string }>;
};

export const metadata = { title: 'Look · Admin' };

export default async function LookPage({ params }: TProps) {
  const { tenantSlug } = await params;
  const { tenant } = await requireTenantMembership(tenantSlug);
  const siteConfig = await queries.siteConfig.getSiteConfig(tenant.id);

  const initialValues = siteConfig
    ? toLookFormValues(siteConfig)
    : defaultLookFormValues();

  return <LookForm tenantSlug={tenant.slug} initialValues={initialValues} />;
}
