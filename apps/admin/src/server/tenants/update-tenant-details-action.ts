'use server';

import { requireAdmin } from '@admin/server/auth/require-admin';
import { logger } from '@admin/utils/logger/logger';
import {
  DOMAIN_PATTERN,
  SLUG_PATTERN,
} from '@admin/utils/tenant-validation/tenant-validation';
import { TENANT_PLAN, type TTenantPlan } from '@blog/config';
import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

const updateTenantDetailsInputSchema = z.object({
  name: z.string().trim().min(1, 'Enter a tenant name.'),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(SLUG_PATTERN, 'Lowercase letters, numbers, and hyphens only.'),
  primaryDomain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(DOMAIN_PATTERN, 'Enter a valid domain.'),
  plan: z.enum(Object.values(TENANT_PLAN) as [TTenantPlan, ...TTenantPlan[]]),
  locale: z.string().trim().min(1, 'Enter a locale.'),
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
 * only while the panel that calls it is still showing its editable form
 * (every provisioning step `IDLE`), a condition enforced client-side since
 * it's a UX state, not an authorization boundary.
 */
export async function updateTenantDetailsAction(
  tenantId: string,
  input: TUpdateTenantDetailsActionInput,
): Promise<TUpdateTenantDetailsActionResult> {
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

  try {
    const result = await queries.tenants.updateTenantDetails(
      tenantId,
      parsed.data,
    );

    switch (result.outcome) {
      case 'updated':
        return { ok: true, tenant: result.tenant };
      case 'slug-taken':
        return {
          ok: false,
          fieldErrors: { slug: 'This slug is already in use.' },
        };
      case 'provisioning-started': {
        const t = await getTranslations('tenantDetailsPanel');
        return { ok: false, error: t('provisioningStartedError') };
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
}
