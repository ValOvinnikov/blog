import type { TMaybeUndefined } from '@blog/config';
import { SANITY_PERSPECTIVE } from '@blog/config/constants';
import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import {
  getPlatformSanityContext,
  type TTenantSanityContext,
} from '@blog/service';
import { isPlatformFallbackAllowed } from '@web/server/tenant/resolve-tenant/resolve-tenant';
import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';

// Drafts are read only through the tenant's own token, never the platform fallback's.
export const resolveRequestSanityContext = async (
  tenantId: TMaybeUndefined<string>,
  row: TMaybeUndefined<TTenant>,
): Promise<TTenantSanityContext> => {
  if (!tenantId) return getPlatformSanityContext();

  const credentials = row && queries.tenants.toTenantSanityCredentials(row);
  if (credentials) {
    const { isEnabled } = await draftMode();
    return isEnabled
      ? { ...credentials, perspective: SANITY_PERSPECTIVE.DRAFTS }
      : credentials;
  }

  if (!isPlatformFallbackAllowed()) {
    notFound();
  }
  return getPlatformSanityContext();
};
