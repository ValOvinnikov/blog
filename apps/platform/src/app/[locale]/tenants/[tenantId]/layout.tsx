import { requireTenantById } from '@platform/server/auth/require-tenant-by-id';

type TProps = {
  children: React.ReactNode;
  params: Promise<{ tenantId: string }>;
};

/**
 * Gates every route nested under this segment — including the bare
 * `studio/` route, which sits outside `(detail)`'s chrome layout and has no
 * gate of its own — behind an `admins` row for the routed tenant id
 * (`requireTenantById`). `(detail)/layout.tsx` renders `AdminShell` around
 * the tenant's regular pages; `requireTenantById` is `cache()`-wrapped so
 * that layout, and the Studio page, reuse this fetch instead of resolving
 * the tenant a second time.
 */
export default async function TenantByIdLayout({ children, params }: TProps) {
  const { tenantId } = await params;
  await requireTenantById(tenantId);

  return children;
}
