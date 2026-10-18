'use server';

import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  DOMAIN_PATTERN,
  isLocaleIsoCode,
  type TActionResult,
} from '@blog/config';
import { queries, TENANT_PLAN } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { TENANT_FIELD_ERROR, TENANT_REFUSAL } from '@platform/constants/tenant';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireAdmin } from '@platform/server/auth/require-admin';
import {
  toTenantFieldErrors,
  type TTenantDetailsFieldError,
} from '@platform/server/tenants/tenant-field-error';
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
  | typeof TENANT_REFUSAL.OWNER_ALREADY_JOINED;

type TUpdateTenantDetailsFailure = Exclude<
  TActionResult<
    typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
    keyof TUpdateTenantDetailsActionInput,
    TTenantDetailsFieldError,
    TUpdateTenantDetailsRefusal
  >,
  { outcome: typeof ACTION_OUTCOME.SUCCESS }
>;

export type TUpdateTenantDetailsActionResult =
  | { outcome: typeof ACTION_OUTCOME.SUCCESS; tenant: TTenant }
  | TUpdateTenantDetailsFailure;

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
      case 'updated':
        await recordAuditEvent({
          logEvent: 'tenants.update_details_audit_failed',
          action: AUDIT_ACTION.SETTINGS_UPDATED,
          targetType: AUDIT_TARGET_TYPE.TENANT,
          targetId: tenantId,
          details: parsed.data,
        });
        return { outcome: ACTION_OUTCOME.SUCCESS, tenant: result.tenant };
      case 'domain-taken':
        return {
          outcome: ACTION_OUTCOME.INVALID,
          fieldErrors: {
            primaryDomain: { reason: TENANT_FIELD_ERROR.DOMAIN_TAKEN },
          },
        };
      case 'domain-invalid':
        return {
          outcome: ACTION_OUTCOME.INVALID,
          fieldErrors: {
            primaryDomain: { reason: TENANT_FIELD_ERROR.DOMAIN_INVALID },
          },
        };
      case 'domain-locked':
        return {
          outcome: ACTION_OUTCOME.INVALID,
          fieldErrors: {
            primaryDomain: {
              reason: TENANT_FIELD_ERROR.DOMAIN_LOCKED,
              values: { step: result.blockingStep },
            },
          },
        };
      case 'provisioning-started':
        return {
          outcome: ACTION_OUTCOME.REFUSED,
          reason: TENANT_REFUSAL.PROVISIONING_STARTED,
        };
      case 'owner-email-taken':
        return {
          outcome: ACTION_OUTCOME.INVALID,
          fieldErrors: {
            ownerEmail: { reason: TENANT_FIELD_ERROR.OWNER_EMAIL_TAKEN },
          },
        };
      case 'owner-already-joined':
        return {
          outcome: ACTION_OUTCOME.REFUSED,
          reason: TENANT_REFUSAL.OWNER_ALREADY_JOINED,
        };
      default: {
        const unhandledOutcome: never = result;
        throw new Error(
          `updateTenantDetailsAction: unhandled outcome ${JSON.stringify(unhandledOutcome)}`,
        );
      }
    }
  } catch (error) {
    logger.error('tenants.update_details_failed', { tenantId, error });
    return { outcome: ACTION_OUTCOME.SERVER_ERROR };
  }
};
