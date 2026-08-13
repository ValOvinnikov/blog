import { TenantOverview } from '@admin/components/tenant-overview';

type TProps = {
  params: Promise<{ tenantSlug: string }>;
};

export const metadata = { title: 'Tenant · Admin' };

export default async function TenantOverviewPage({ params }: TProps) {
  const { tenantSlug } = await params;

  return <TenantOverview tenantSlug={tenantSlug} />;
}
