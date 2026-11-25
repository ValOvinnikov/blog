import { NO_ACCESS_REASON } from '@platform/constants/no-access';
import {
  SELECT_TENANT_FROM,
  SELECT_TENANT_SEARCH_PARAM,
} from '@platform/constants/select-tenant';
import { auth } from '@platform/server/auth/auth';
import { isSuperAdmin } from '@platform/server/auth/is-super-admin';
import { ACTIVE_TENANT_COOKIE } from '@platform/utils/active-tenant-cookie/active-tenant-cookie';
import { adminRoutes } from '@platform/utils/routes/routes';
import { toServerCookieOptions } from '@platform/utils/server-cookie-options/server-cookie-options';
import { signInRedirect } from '@platform/utils/sign-in-redirect/sign-in-redirect';
import { queries } from '@shinefold/db';
import { hasLength } from '@shinefold/utils/primitives';
import { NextResponse } from 'next/server';

const ACTIVE_TENANT_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

// Every link here must pass `prefetch={false}`: a prefetch is a GET and would select the tenant.
export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return signInRedirect(url);

  const { searchParams } = url;
  const tenantId = searchParams.get(SELECT_TENANT_SEARCH_PARAM.TENANT_ID);

  if (!tenantId) {
    return NextResponse.redirect(
      new URL(adminRoutes.dashboardSelectTenant(), url),
    );
  }

  const membership = await queries.memberships.getMembership(userId, tenantId);
  const authorized = membership
    ? true
    : isSuperAdmin(await queries.admins.getAdminByUserId(userId)) &&
      hasLength(await queries.tenants.listTenantsByIds([tenantId]));

  if (!authorized) {
    const isFromInvite =
      searchParams.get(SELECT_TENANT_SEARCH_PARAM.FROM) ===
      SELECT_TENANT_FROM.INVITE;
    const reason = isFromInvite
      ? NO_ACCESS_REASON.SITE_INVITE
      : NO_ACCESS_REASON.SITE;
    return NextResponse.redirect(new URL(adminRoutes.noAccess(reason), url));
  }

  const response = NextResponse.redirect(new URL(adminRoutes.dashboard(), url));

  response.cookies.set(
    ACTIVE_TENANT_COOKIE,
    tenantId,
    toServerCookieOptions(ACTIVE_TENANT_COOKIE_MAX_AGE_SECONDS),
  );

  return response;
}
