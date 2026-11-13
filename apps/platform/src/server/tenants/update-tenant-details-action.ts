'use server';

import {
  ACTION_OUTCOME,
  isOutcomeSuccess,
  type TActionResult,
  type TOutcome,
} from '@blog/config';
import { queries, TENANT_DETAILS_UPDATE_OUTCOME } from '@blog/db';
import { toOutcome } from '@blog/utils/to-outcome';
import {
  TENANT_FIELD_ERROR,
  TENANT_REFUSAL,
  TENANT_LOG,
} from '@platform/constants/tenant';
import { requireAdmin } from '@platform/server/auth/require-admin';
import {
  completeTenantDetailsUpdate,
  type TTenantDetailsSaved,
} from '@platform/server/tenants/complete-tenant-details-update';
import { resolveLiveTenant } from '@platform/server/tenants/resolve-live-tenant';
import type { TTenantDetailsFieldError } from '@platform/server/tenants/tenant-field-error';
import {
  toUpdateTenantDetailsFieldErrors,
  type TUpdateTenantDetailsActionInput,
  updateTenantDetailsInputSchema,
} from '@platform/server/tenants/update-tenant-details-input';
import { env } from '@platform/utils/env/env';
import { isCustomDomain } from '@platform/utils/is-custom-domain/is-custom-domain';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';

export type TUpdateTenantDetailsRefusal =
  | typeof TENANT_REFUSAL.NOT_FOUND
  | typeof TENANT_REFUSAL.ARCHIVED
  | typeof TENANT_REFUSAL.LOCALE_IS_ADDITIONAL
  | typeof TENANT_REFUSAL.PROVISIONING_STARTED
  | typeof TENANT_REFUSAL.OWNER_ALREADY_JOINED
  | typeof TENANT_REFUSAL.OWNER_HAS_FREE_TENANT;

type TUpdateTenantDetailsFailure = Exclude<
  TActionResult<
    typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
    keyof TUpdateTenantDetailsActionInput,
    TTenantDetailsFieldError,
    TUpdateTenantDetailsRefusal
  >,
  TOutcome<typeof ACTION_OUTCOME.SUCCESS>
>;

export type TUpdateTenantDetailsActionResult =
  TTenantDetailsSaved | TUpdateTenantDetailsFailure;

export const updateTenantDetailsAction = async (
  tenantId: string,
  input: TUpdateTenantDetailsActionInput,
): Promise<TUpdateTenantDetailsActionResult> => {
  await requireAdmin();

  const parsed = updateTenantDetailsInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: toUpdateTenantDetailsFieldErrors(parsed.error.issues),
    };
  }

  const resolved = await resolveLiveTenant(tenantId);
  if (!isOutcomeSuccess(resolved)) return resolved;
  const { tenant } = resolved;
  if (
    parsed.data.primaryDomain !== tenant.primaryDomain &&
    isCustomDomain(tenant.primaryDomain, env.TENANT_ROOT_DOMAIN)
  ) {
    return {
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        primaryDomain: { reason: TENANT_FIELD_ERROR.DOMAIN_CUSTOM_MAIN },
      },
    };
  }
  if (
    parsed.data.locale !== tenant.locale &&
    tenant.additionalLocales.includes(parsed.data.locale)
  ) {
    return {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.LOCALE_IS_ADDITIONAL,
    };
  }

  try {
    const result = await queries.tenants.updateTenantDetails(
      tenantId,
      parsed.data,
    );

    switch (result.outcome) {
      case TENANT_DETAILS_UPDATE_OUTCOME.UPDATED:
        return completeTenantDetailsUpdate(
          tenantId,
          parsed.data,
          result,
          tenant,
        );
      case TENANT_DETAILS_UPDATE_OUTCOME.DOMAIN_TAKEN:
        return {
          outcome: ACTION_OUTCOME.INVALID,
          fieldErrors: {
            primaryDomain: { reason: TENANT_FIELD_ERROR.DOMAIN_TAKEN },
          },
        };
      case TENANT_DETAILS_UPDATE_OUTCOME.DOMAIN_INVALID:
        return {
          outcome: ACTION_OUTCOME.INVALID,
          fieldErrors: {
            primaryDomain: { reason: TENANT_FIELD_ERROR.DOMAIN_INVALID },
          },
        };
      case TENANT_DETAILS_UPDATE_OUTCOME.DOMAIN_LOCKED:
        return {
          outcome: ACTION_OUTCOME.INVALID,
          fieldErrors: {
            primaryDomain: {
              reason: TENANT_FIELD_ERROR.DOMAIN_LOCKED,
              values: { step: result.blockingStep },
            },
          },
        };
      case TENANT_DETAILS_UPDATE_OUTCOME.PROVISIONING_STARTED:
        return {
          outcome: ACTION_OUTCOME.REFUSED,
          reason: TENANT_REFUSAL.PROVISIONING_STARTED,
        };
      case TENANT_DETAILS_UPDATE_OUTCOME.OWNER_EMAIL_TAKEN:
        return {
          outcome: ACTION_OUTCOME.INVALID,
          fieldErrors: {
            ownerEmail: { reason: TENANT_FIELD_ERROR.OWNER_EMAIL_TAKEN },
          },
        };
      case TENANT_DETAILS_UPDATE_OUTCOME.OWNER_ALREADY_JOINED:
        return {
          outcome: ACTION_OUTCOME.REFUSED,
          reason: TENANT_REFUSAL.OWNER_ALREADY_JOINED,
        };
      case TENANT_DETAILS_UPDATE_OUTCOME.OWNS_FREE_TENANT:
        return {
          outcome: ACTION_OUTCOME.REFUSED,
          reason: TENANT_REFUSAL.OWNER_HAS_FREE_TENANT,
        };
      default: {
        const unhandledOutcome: never = result;
        throw new Error(
          `updateTenantDetailsAction: unhandled outcome ${JSON.stringify(unhandledOutcome)}`,
        );
      }
    }
  } catch (error) {
    logger.error(TENANT_LOG.UPDATE_DETAILS_FAILED, {
      tenantId,
      ...toLoggableError(error),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
