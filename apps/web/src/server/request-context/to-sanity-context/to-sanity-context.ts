import type { TMaybeUndefined } from '@blog/config';
import { SANITY_PERSPECTIVE } from '@blog/config/constants';
import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import {
  getPlatformSanityContext,
  type TTenantSanityContext,
} from '@blog/service';
import { isPlatformFallbackAllowed } from '@web/server/tenant/resolve-tenant/resolve-tenant';
import { notFound } from 'next/navigation';

/** A draft preview reads only the tenant's own project, never the platform fallback. */
export const toSanityContext = (
  tenantId: TMaybeUndefined<string>,
  row: TMaybeUndefined<TTenant>,
  isDraftPreview: boolean,
): TTenantSanityContext => {
  if (!tenantId) return getPlatformSanityContext();

  const credentials = row && queries.tenants.toTenantSanityCredentials(row);
  if (credentials) {
    return isDraftPreview
      ? { ...credentials, perspective: SANITY_PERSPECTIVE.DRAFTS }
      : credentials;
  }

  if (isDraftPreview || !isPlatformFallbackAllowed()) {
    notFound();
  }
  return getPlatformSanityContext();
};
