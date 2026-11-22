import 'server-only';

import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config';
import { queries } from '@shinefold/db';
import type { TTenantOAuthCredentialsByProvider } from '@shinefold/db/queries/tenant-oauth-credentials/get-tenant-oauth-credentials/get-tenant-oauth-credentials';
import { AUTH_ACTION } from '@web/constants/session';
import { SIGN_IN_LOG } from '@web/constants/sign-in';
import { getEffectiveEntitlements } from '@web/server/site-config/get-effective-entitlements/get-effective-entitlements';
import { resolveTenant } from '@web/server/tenant/resolve-tenant/resolve-tenant';
import { logger } from '@web/utils/logger/logger';
import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';
import { cache } from 'react';

const SHARED_APPS: TTenantOAuthCredentialsByProvider = {};

const loadEntitledCredentials = async (
  tenantId: TMaybeUndefined<string>,
): Promise<TTenantOAuthCredentialsByProvider> => {
  if (!tenantId) return SHARED_APPS;

  const { hasOwnOAuthApps } = await getEffectiveEntitlements(tenantId);
  if (!hasOwnOAuthApps) return SHARED_APPS;

  return queries.tenantOAuthCredentials.getTenantOAuthCredentials(tenantId);
};

const orSharedApps = async (
  load: () => Promise<TTenantOAuthCredentialsByProvider>,
): Promise<TTenantOAuthCredentialsByProvider> => {
  try {
    return await load();
  } catch (error) {
    logger.error(SIGN_IN_LOG.SITE_CREDENTIALS_FAILED, { error });
    return SHARED_APPS;
  }
};

export const getSiteOAuthCredentials = cache(
  (tenantId: TMaybeUndefined<string>) =>
    orSharedApps(() => loadEntitledCredentials(tenantId)),
);

// An owner registers only the main address's callback with their provider, so any other address keeps the shared apps.
const loadHostCredentials = async (
  host: TMaybeNull<string>,
): Promise<TTenantOAuthCredentialsByProvider> => {
  const tenant = await resolveTenant(host);
  return tenant && tenant.primaryDomain === host
    ? loadEntitledCredentials(tenant.id)
    : SHARED_APPS;
};

export const getHostSiteOAuthCredentials = cache(async () =>
  orSharedApps(async () => loadHostCredentials((await headers()).get('host'))),
);

const isProviderUsingRequest = (
  request: TMaybeUndefined<NextRequest>,
): request is NextRequest =>
  Boolean(request) &&
  request?.nextUrl.pathname.split('/').at(-1) !== AUTH_ACTION.SESSION;

// A session read registers no provider: `auth()` passes no request, and `SessionProvider` polls `/api/auth/session` on every page load.
export const getRequestSiteOAuthCredentials = async (
  request: TMaybeUndefined<NextRequest>,
): Promise<TTenantOAuthCredentialsByProvider> =>
  isProviderUsingRequest(request)
    ? orSharedApps(() => loadHostCredentials(request.headers.get('host')))
    : SHARED_APPS;
