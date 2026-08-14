import { LookForm } from '@admin/components/look-form';
import { requireTenantMembership } from '@admin/server/auth/require-tenant-membership';
import {
  defaultLookFormValues,
  toLookFormValues,
} from '@admin/utils/default-look-values/default-look-values';
import { queries } from '@blog/db';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

type TProps = {
  params: Promise<{ tenantSlug: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pageMetadata');
  return { title: t('look') };
}

export default async function LookPage({ params }: TProps) {
  const { tenantSlug } = await params;
  const { tenant } = await requireTenantMembership(tenantSlug);
  const siteConfig = await queries.siteConfig.getSiteConfig(tenant.id);

  const initialValues = siteConfig
    ? toLookFormValues(siteConfig)
    : defaultLookFormValues();

  return <LookForm tenantSlug={tenant.slug} initialValues={initialValues} />;
}
