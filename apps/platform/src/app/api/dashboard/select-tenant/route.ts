import { queries } from '@blog/db';
import { auth } from '@platform/server/auth/auth';
import { isSuperAdmin } from '@platform/server/auth/is-super-admin';
import { ACTIVE_TENANT_COOKIE } from '@platform/utils/active-tenant-cookie/active-tenant-cookie';
import { adminRoutes } from '@platform/utils/routes/routes';
import { NextResponse } from 'next/server';

const ACTIVE_TENANT_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/**
 * `GET /api/dashboard/select-tenant?tenantId=…` — `/dashboard`'s
 * tenant-picker link target (`DashboardTenantPicker`, reused from the
 * sidebar's `TenantSwitcher`). Re-verifies `tenantId` against the signed-in
 * user's own `memberships` before trusting it — never a client-supplied
 * value taken at face value — or, for a platform SUPERADMIN with no real
 * membership on that tenant, that the tenant actually exists. Then sets the
 * "active tenant" cookie `resolveDashboardTenant` reads on every subsequent
 * `/dashboard/**` request. Sits under `/api` (not `[locale]`) alongside this
 * app's other Route Handlers, matching `localePrefix: 'never'`.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.redirect(new URL(adminRoutes.signIn(), url));
  }

  const tenantId = url.searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.redirect(
      new URL(adminRoutes.dashboardSelectTenant(), url),
    );
  }

  const membership = await queries.memberships.getMembership(userId, tenantId);
  const authorized = membership
    ? true
    : (await isSuperAdmin(userId)) &&
      (await queries.tenants.listTenantsByIds([tenantId])).length > 0;

  if (!authorized) {
    return NextResponse.json(null, { status: 404 });
  }

  const response = NextResponse.redirect(new URL(adminRoutes.dashboard(), url));

  response.cookies.set(ACTIVE_TENANT_COOKIE, tenantId, {
    maxAge: ACTIVE_TENANT_COOKIE_MAX_AGE_SECONDS,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });

  return response;
}
