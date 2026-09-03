import { listSessionTenants } from '@platform/server/auth/list-session-tenants';

type TProps = {
  children: React.ReactNode;
};

/**
 * `/dashboard`'s outer gate: signed in and holding at least one membership
 * (`listSessionTenants` redirects to sign-in or `/workspace-pending`
 * otherwise) — deliberately *not* narrowed to a single resolved tenant, or
 * `/dashboard/select-tenant` (reached precisely when there's more than one
 * to choose from) would redirect right back to itself. `(tenant)/layout.tsx`
 * narrows further via `resolveDashboardTenant` for its own gated subtree.
 */
export default async function DashboardLayout({ children }: TProps) {
  await listSessionTenants();

  return children;
}
