import type { TMaybeUndefined } from '@shinefold/config';
import { SANITY_PERSPECTIVE } from '@shinefold/config/constants';
import { queries } from '@shinefold/db';
import type { TTenant } from '@shinefold/db/schema/tenants';
import {
  getPlatformSanityContext,
  type TTenantSanityContext,
} from '@shinefold/service';
import { isProductionEnvironment } from '@web/utils/is-production-environment';
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

  if (isDraftPreview || isProductionEnvironment()) {
    notFound();
  }
  return getPlatformSanityContext();
};
