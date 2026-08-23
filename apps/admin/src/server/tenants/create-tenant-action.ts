'use server';

import { routing } from '@admin/i18n/routing';
import { recordAuditEvent } from '@admin/server/audit/record-audit-event';
import { signIn } from '@admin/server/auth/auth';
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
  // Set once the operator has already seen and accepted
  // `ownerInviteConfirmation` for this exact email — the Details form
  // re-submits with this flag on a second click rather than the not-found
  // branch below ever needing its own separate "confirm" endpoint.
  confirmOwnerInvite: z.boolean().optional().default(false),
});

export type TCreateTenantInput = z.input<typeof createTenantInputSchema>;

export type TCreateTenantFieldErrors = Partial<
  Record<keyof TCreateTenantInput, string>
>;

export type TCreateTenantResult = {
  ok: false;
  error?: string;
  fieldErrors?: TCreateTenantFieldErrors;
  // Present only for the not-yet-confirmed not-found-owner case: the Details
  // form shows this message and lets the operator resubmit (unchanged
  // email) to actually proceed down the invite path.
  ownerInviteConfirmation?: { email: string; message: string };
};

/**
 * The Details step's submit handler — resolves the owner email to an
 * existing user when one exists, or (once the operator has confirmed)
 * proceeds down the invite path for one that doesn't — inserts the draft
 * tenant row, kicks off provisioning, and redirects straight to the
 * tenant's status page. There is no `{ ok: true }` return: `redirect()`
 * throws before this function can return normally, so every value this
 * resolves to is a failure, or a pending confirmation, for the Details form
 * to show inline.
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

  const { name, slug, domain, plan, ownerEmail, confirmOwnerInvite } =
    parsed.data;

  const owner = await queries.users.getUserByEmail(ownerEmail);
  if (!owner && !confirmOwnerInvite) {
    return {
      ok: false,
      ownerInviteConfirmation: {
        email: ownerEmail,
        message: `No account found for ${ownerEmail} — they'll be sent an invite to sign in and manage this tenant as owner.`,
      },
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
      owner: owner
        ? { type: 'user', userId: owner.id }
        : { type: 'invite', email: ownerEmail },
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

  // The invited owner shouldn't have to find the sign-in page and type
  // their own email first — trigger the magic-link email immediately.
  // `redirect: false` returns a result instead of throwing, since this
  // action still has its own `redirect()` below; a failed send never blocks
  // provisioning (the tenant and its pending invite row already exist).
  if (!owner) {
    try {
      const inviteEmailResult = await signIn('email', {
        email: ownerEmail,
        redirect: false,
      });
      if (!inviteEmailResult?.ok) {
        logger.error('tenants.owner_invite_email_failed', {
          tenantId,
          ownerEmail,
          error: inviteEmailResult?.error,
        });
      }
    } catch (error) {
      logger.error('tenants.owner_invite_email_failed', {
        tenantId,
        ownerEmail,
        error,
      });
    }
  }

  await dispatchProvisioningWorkflow(tenantId);

  redirect(adminRoutes.tenantStatus(tenantId));
};
