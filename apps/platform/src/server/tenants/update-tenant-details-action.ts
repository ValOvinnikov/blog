'use server';

import { AUDIT_ACTION, AUDIT_TARGET_TYPE, DOMAIN_PATTERN } from '@blog/config';
import { queries, TENANT_PLAN, type TTenantPlan } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireAdmin } from '@platform/server/auth/require-admin';
import { logger } from '@platform/utils/logger/logger';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

const updateTenantDetailsInputSchema = z.object({
  name: z.string().trim().min(1, 'Enter a tenant name.'),
  primaryDomain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(DOMAIN_PATTERN, 'Enter a valid domain.'),
  plan: z.enum(Object.values(TENANT_PLAN) as [TTenantPlan, ...TTenantPlan[]]),
  locale: z.string().trim().min(1, 'Enter a locale.'),
  ownerEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email('Enter a valid email.')
    .optional(),
});

export type TUpdateTenantDetailsActionInput = z.input<
  typeof updateTenantDetailsInputSchema
>;

export type TUpdateTenantDetailsFieldErrors = Partial<
  Record<keyof TUpdateTenantDetailsActionInput, string>
>;

export type TUpdateTenantDetailsActionResult =
  | { ok: true; tenant: TTenant }
  | {
      ok: false;
      error?: string;
      fieldErrors?: TUpdateTenantDetailsFieldErrors;
    };

/**
 * The provisioning status page's editable-details save handler — reachable
 * whenever the panel that calls it shows any editable field: every step
 * `IDLE`, or FAILED with a field an already-completed step hasn't locked.
 * The client only ever submits a locked field's unchanged value, but that's
 * a UX affordance, not an authorization boundary — the `domain-locked`
 * outcome below is the real enforcement, re-checked here against the
 * current db row regardless of what the client sends. Likewise the disabled
 * panel an archived tenant renders is a UX affordance too — the
 * `deprovisionedAt` check below is what actually stops the write.
 */
export const updateTenantDetailsAction = async (
  tenantId: string,
  input: TUpdateTenantDetailsActionInput,
): Promise<TUpdateTenantDetailsActionResult> => {
  await requireAdmin();

  const parsed = updateTenantDetailsInputSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: TUpdateTenantDetailsFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && !(key in fieldErrors)) {
        fieldErrors[key as keyof TUpdateTenantDetailsActionInput] =
          issue.message;
      }
    }
    return { ok: false, fieldErrors };
  }

  const tenant = await queries.tenants.getTenantById(tenantId, {
    includeArchived: true,
  });
  if (!tenant) {
    const t = await getTranslations('tenantDetailsPanel');
    return { ok: false, error: t('notFoundError') };
  }
  if (tenant.deprovisionedAt) {
    const t = await getTranslations('tenantDetailsPanel');
    return { ok: false, error: t('archivedError') };
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
        return { ok: true, tenant: result.tenant };
      case 'domain-taken':
        return {
          ok: false,
          fieldErrors: { primaryDomain: 'This domain is already in use.' },
        };
      case 'domain-invalid':
        return {
          ok: false,
          fieldErrors: { primaryDomain: 'Enter a valid domain.' },
        };
      case 'domain-locked': {
        const t = await getTranslations('tenantDetailsPanel');
        const tSteps = await getTranslations('provisioningStatusView');
        return {
          ok: false,
          fieldErrors: {
            primaryDomain: t('fieldLockedReasonStep', {
              step: tSteps(`stepLabel.${result.blockingStep}`),
            }),
          },
        };
      }
      case 'provisioning-started': {
        const t = await getTranslations('tenantDetailsPanel');
        return { ok: false, error: t('provisioningStartedError') };
      }
      case 'owner-email-taken': {
        const t = await getTranslations('tenantDetailsPanel');
        return {
          ok: false,
          fieldErrors: { ownerEmail: t('ownerEmailTakenError') },
        };
      }
      case 'owner-already-joined': {
        const t = await getTranslations('tenantDetailsPanel');
        return { ok: false, error: t('ownerAlreadyJoinedError') };
      }
      default: {
        const unhandledOutcome: never = result;
        throw new Error(
          `updateTenantDetailsAction: unhandled outcome ${JSON.stringify(unhandledOutcome)}`,
        );
      }
    }
  } catch (error) {
    logger.error('tenants.update_details_failed', { tenantId, error });
    return { ok: false, error: "Couldn't save tenant details — try again." };
  }
};
