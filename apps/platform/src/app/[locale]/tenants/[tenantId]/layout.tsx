import { requireTenantById } from '@platform/server/auth/require-tenant-by-id';

type TProps = {
  children: React.ReactNode;
  params: Promise<{ tenantId: string }>;
};

export default async function TenantByIdLayout({ children, params }: TProps) {
  const { tenantId } = await params;
  await requireTenantById(tenantId);

  return children;
}
