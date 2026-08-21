'use server';

import { routing } from '@admin/i18n/routing';
import { recordAuditEvent } from '@admin/server/audit/record-audit-event';
import { requireAdmin } from '@admin/server/auth/require-admin';
import { dispatchProvisioningWorkflow } from '@admin/server/provisioning/dispatch-provisioning-workflow';
import { logger } from '@admin/utils/logger/logger';
import { DOMAIN_PATTERN, SLUG_PATTERN } from '@admin/utils/path/path';
import { adminRoutes } from '@admin/utils/routes/routes';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE, ERROR_CODE } from '@blog/config';
import { queries, TENANT_PLAN, type TTenantPlan } from '@blog/db';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const createTenantInputSchema = z.object({
  name: z.string().trim().min(1, 'Enter a tenant name.'),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(SLUG_PATTERN, 'Lowercase letters, numbers, and hyphens only.'),
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(DOMAIN_PATTERN, 'Enter a valid domain.'),
  plan: z.enum(Object.values(TENANT_PLAN) as [TTenantPlan, ...TTenantPlan[]]),
  ownerEmail: z.string().trim().toLowerCase().email('Enter a valid email.'),
});

export type TCreateTenantInput = z.input<typeof createTenantInputSchema>;

export type TCreateTenantFieldErrors = Partial<
  Record<keyof TCreateTenantInput, string>
>;

export type TCreateTenantResult = {
  ok: false;
  error?: string;
  fieldErrors?: TCreateTenantFieldErrors;
};

/**
 * The Details step's submit handler — resolves the owner email to an
 * existing user (no invite-email flow), inserts the draft tenant row, kicks
 * off provisioning, and redirects straight to the tenant's status page.
 * There is no `{ ok: true }` return: `redirect()` throws before this
 * function can return normally, so every value this resolves to is a
 * failure the Details form should show inline.
 */
export const createTenantAction = async (
  input: TCreateTenantInput,
): Promise<TCreateTenantResult> => {
  await requireAdmin();

  const parsed = createTenantInputSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: TCreateTenantFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && !(key in fieldErrors)) {
        fieldErrors[key as keyof TCreateTenantInput] = issue.message;
      }
    }
    return { ok: false, fieldErrors };
  }

  const { name, slug, domain, plan, ownerEmail } = parsed.data;

  const owner = await queries.users.getUserByEmail(ownerEmail);
  if (!owner) {
    return {
      ok: false,
      fieldErrors: { ownerEmail: 'No registered user matches this email.' },
    };
  }

  const [existingSlug, existingDomain] = await Promise.all([
    queries.tenants.getTenantBySlug(slug, { includeArchived: true }),
    queries.tenantDomains.getTenantByDomain(domain),
  ]);

  if (existingSlug) {
    return {
      ok: false,
      fieldErrors: { slug: 'This slug is already in use.' },
    };
  }

  if (existingDomain) {
    return {
      ok: false,
      fieldErrors: { domain: 'This domain is already in use.' },
    };
  }

  let tenantId: string;
  try {
    const result = await queries.tenants.createTenantDraft({
      name,
      slug,
      domain,
      locale: routing.defaultLocale,
      plan,
      ownerUserId: owner.id,
    });

    if (!result.ok) {
      if (result.error === ERROR_CODE.DB_DUPLICATE_SLUG) {
        return {
          ok: false,
          fieldErrors: { slug: 'This slug is already in use.' },
        };
      }
      logger.error('tenants.create_draft_failed', {
        slug,
        domain,
        error: result.error,
      });
      return { ok: false, error: "Couldn't create the tenant — try again." };
    }

    tenantId = result.data.id;
  } catch (error) {
    logger.error('tenants.create_draft_failed', { slug, domain, error });
    return { ok: false, error: "Couldn't create the tenant — try again." };
  }

  await recordAuditEvent({
    logEvent: 'tenants.create_audit_failed',
    action: AUDIT_ACTION.CREATED,
    targetType: AUDIT_TARGET_TYPE.TENANT,
    targetId: tenantId,
    details: { name, slug, domain, plan, ownerEmail },
  });

  await dispatchProvisioningWorkflow(tenantId);

  redirect(adminRoutes.tenantStatus(tenantId));
};
