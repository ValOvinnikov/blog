import 'server-only';

import { TENANT_FIELD_ERROR, TENANT_REFUSAL } from '@platform/constants/tenant';
import { hasStoredSubscription } from '@platform/server/billing/upgrade-state-for';
import type { updateTenantDetailsInputSchema } from '@platform/server/tenants/update-tenant-details-input';
import { env } from '@platform/utils/env/env';
import { isCustomDomain } from '@platform/utils/is-custom-domain/is-custom-domain';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import {
  ACTION_OUTCOME,
  type TMaybeUndefined,
  type TOutcome,
  type TReasonedFailure,
} from '@shinefold/config';
import type { z } from 'zod';

type TTenantDetailsChangeRefusal =
  | (TOutcome<typeof ACTION_OUTCOME.INVALID> & {
      fieldErrors: {
        primaryDomain: TReasonedFailure<
          typeof TENANT_FIELD_ERROR.DOMAIN_CUSTOM_MAIN
        >;
      };
    })
  | (TOutcome<typeof ACTION_OUTCOME.REFUSED> &
      TReasonedFailure<
        | typeof TENANT_REFUSAL.LOCALE_IS_ADDITIONAL
        | typeof TENANT_REFUSAL.PLAN_FOLLOWS_SUBSCRIPTION
      >);

export const refuseTenantDetailsChange = (
  {
    primaryDomain,
    locale,
    plan,
  }: z.output<typeof updateTenantDetailsInputSchema>,
  tenant: TPlatformTenant,
): TMaybeUndefined<TTenantDetailsChangeRefusal> => {
  if (
    primaryDomain !== tenant.primaryDomain &&
    isCustomDomain(tenant.primaryDomain, env.TENANT_ROOT_DOMAIN)
  ) {
    return {
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        primaryDomain: { reason: TENANT_FIELD_ERROR.DOMAIN_CUSTOM_MAIN },
      },
    };
  }
  if (locale !== tenant.locale && tenant.additionalLocales.includes(locale)) {
    return {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.LOCALE_IS_ADDITIONAL,
    };
  }
  if (plan !== tenant.plan && hasStoredSubscription(tenant)) {
    return {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.PLAN_FOLLOWS_SUBSCRIPTION,
    };
  }
  return undefined;
};
