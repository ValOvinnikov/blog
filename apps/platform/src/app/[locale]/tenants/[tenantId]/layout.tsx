import { TenantPlanProvider } from '@platform/context/tenant-plan-provider';
import { requireTenantById } from '@platform/server/auth/require-tenant-by-id';

type TProps = {
  children: React.ReactNode;
  params: Promise<{ tenantId: string }>;
};

export default async function TenantByIdLayout({ children, params }: TProps) {
  const { tenantId } = await params;
  const { tenant } = await requireTenantById(tenantId);

  return <TenantPlanProvider plan={tenant.plan}>{children}</TenantPlanProvider>;
}
