'use server';

import {
  ACTION_OUTCOME,
  DOMAIN_PATTERN,
  isLocaleIsoCode,
  type TActionResult,
  type TOutcome,
} from '@blog/config';
import { queries, TENANT_DETAILS_UPDATE_OUTCOME, TENANT_PLAN } from '@blog/db';
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
import {
  toTenantFieldErrors,
  type TTenantDetailsFieldError,
} from '@platform/server/tenants/tenant-field-error';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import { z } from 'zod';

const updateTenantDetailsInputSchema = z.object({
  name: z.string().trim().min(1),
  primaryDomain: z.string().trim().toLowerCase().regex(DOMAIN_PATTERN),
  plan: z.enum(TENANT_PLAN),
  locale: z.string().refine(isLocaleIsoCode),
  ownerEmail: z.string().trim().toLowerCase().email().optional(),
});

export type TUpdateTenantDetailsActionInput = z.input<
  typeof updateTenantDetailsInputSchema
>;

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
      fieldErrors: toTenantFieldErrors<keyof TUpdateTenantDetailsActionInput>(
        parsed.error.issues,
        {
          name: TENANT_FIELD_ERROR.NAME_REQUIRED,
          primaryDomain: TENANT_FIELD_ERROR.DOMAIN_INVALID,
          plan: TENANT_FIELD_ERROR.PLAN_UNSUPPORTED,
          locale: TENANT_FIELD_ERROR.LOCALE_UNSUPPORTED,
          ownerEmail: TENANT_FIELD_ERROR.EMAIL_INVALID,
        },
      ),
    };
  }

  const tenant = await queries.tenants.getTenantById(tenantId, {
    includeArchived: true,
  });
  if (!tenant) {
    return {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.NOT_FOUND,
    };
  }
  if (tenant.deprovisionedAt) {
    return { outcome: ACTION_OUTCOME.REFUSED, reason: TENANT_REFUSAL.ARCHIVED };
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
        return completeTenantDetailsUpdate(tenantId, parsed.data, result);
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
