import 'server-only';

import { ACTION_OUTCOME, type TMaybeUndefined } from '@blog/config';
import { queries } from '@blog/db';
import { toOutcome } from '@blog/utils/to-outcome';
import { ONBOARDING_LOG } from '@platform/constants/onboarding';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
import { checkTenantSlug } from '@platform/server/tenants/check-tenant-slug';
import { logger } from '@platform/utils/logger/logger';

import type { TCreateSiteResult } from './create-site-input';

type TCheckCreateSiteInput = {
  slug: string;
  rootDomain: string;
  email: string;
};

/** Runs before the Create site gate, so a submit these refuse never spends one of its daily slots. */
export const checkCreateSiteInput = async ({
  slug,
  rootDomain,
  email,
}: TCheckCreateSiteInput): Promise<TMaybeUndefined<TCreateSiteResult>> => {
  const [slugError, ownsFreeTenant] = await Promise.all([
    checkTenantSlug(slug, rootDomain),
    queries.tenants.ownsFreeTenant(email),
  ]);

  if (slugError) {
    return {
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { slug: { reason: slugError } },
    };
  }

  if (!ownsFreeTenant.ok) {
    logger.error(ONBOARDING_LOG.OWNS_FREE_TENANT_CHECK_FAILED, {
      error: ownsFreeTenant.error,
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }

  return ownsFreeTenant.data
    ? {
        outcome: ACTION_OUTCOME.REFUSED,
        reason: TENANT_REFUSAL.OWNER_HAS_FREE_TENANT,
      }
    : undefined;
};
