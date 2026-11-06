import 'server-only';

import type { TMaybeUndefined } from '@blog/config';
import { queries } from '@blog/db';
import { PLAN_ENTITLEMENTS } from '@blog/db/constants';
import type { TTenantOAuthCredentialsByProvider } from '@blog/db/queries/tenant-oauth-credentials/get-tenant-oauth-credentials/get-tenant-oauth-credentials';
import { SIGN_IN_LOG } from '@web/constants/sign-in';
import { getEffectivePlan } from '@web/server/site-config/get-effective-plan/get-effective-plan';
import { resolveTenantId } from '@web/server/tenant/resolve-tenant/resolve-tenant';
import { logger } from '@web/utils/logger/logger';
import type { NextRequest } from 'next/server';
import { cache } from 'react';

const SHARED_APPS: TTenantOAuthCredentialsByProvider = {};

const loadEntitledCredentials = async (
  tenantId: TMaybeUndefined<string>,
): Promise<TTenantOAuthCredentialsByProvider> => {
  if (!tenantId) return SHARED_APPS;

  const plan = await getEffectivePlan(tenantId);
  if (!PLAN_ENTITLEMENTS[plan].hasOwnOAuthApps) return SHARED_APPS;

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

// Auth.js passes no request when `auth()` reads a session, which registers no provider.
export const getRequestSiteOAuthCredentials = async (
  request: TMaybeUndefined<NextRequest>,
): Promise<TTenantOAuthCredentialsByProvider> =>
  request
    ? orSharedApps(async () =>
        loadEntitledCredentials(
          await resolveTenantId(request.headers.get('host')),
        ),
      )
    : SHARED_APPS;
