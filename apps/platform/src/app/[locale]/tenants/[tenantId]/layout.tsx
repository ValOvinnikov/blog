import { requireTenantById } from '@platform/server/auth/require-tenant-by-id';

type TProps = {
  children: React.ReactNode;
  params: Promise<{ tenantId: string }>;
};

/**
 * Gates every route nested under this segment, including `studio/`, behind
 * an `admins` row for the routed tenant id (`requireTenantById`).
 * `(detail)/layout.tsx` renders `AdminShell` around all of it;
 * `requireTenantById` is `cache()`-wrapped so that layout, and each page,
 * reuse this fetch instead of resolving the tenant a second time.
 */
export default async function TenantByIdLayout({ children, params }: TProps) {
  const { tenantId } = await params;
  await requireTenantById(tenantId);

  return children;
}
