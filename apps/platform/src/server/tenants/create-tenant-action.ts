'use server';

import {
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  DOMAIN_PATTERN,
} from '@blog/config';
import { queries, TENANT_PLAN, type TTenantPlan } from '@blog/db';
import { DOMAIN_AVAILABILITY } from '@platform/constants/domain';
import { routing } from '@platform/i18n/routing';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { signIn } from '@platform/server/auth/auth';
import { requireAdmin } from '@platform/server/auth/require-admin';
import { checkDomainAvailability } from '@platform/server/provisioning/check-domain-availability';
import { startProvisioning } from '@platform/server/provisioning/start-provisioning';
import {
  createOwnerInviteToken,
  verifyOwnerInviteToken,
} from '@platform/server/tenants/owner-invite-token';
import { logger } from '@platform/utils/logger/logger';
import { adminRoutes } from '@platform/utils/routes/routes';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const createTenantInputSchema = z.object({
  name: z.string().trim().min(1, 'Enter a tenant name.'),
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(DOMAIN_PATTERN, 'Enter a valid domain.'),
  plan: z.enum(Object.values(TENANT_PLAN) as [TTenantPlan, ...TTenantPlan[]]),
  ownerEmail: z.string().trim().toLowerCase().email('Enter a valid email.'),
  confirmOwnerInviteToken: z.string().optional(),
});

export type TCreateTenantInput = z.input<typeof createTenantInputSchema>;

export type TCreateTenantFieldErrors = Partial<
  Record<keyof TCreateTenantInput, string>
>;

export type TCreateTenantResult = {
  ok: false;
  error?: string;
  fieldErrors?: TCreateTenantFieldErrors;
  ownerInviteConfirmation?: { email: string; message: string; token: string };
};

/**
 * Never resolves `{ ok: true }`: success ends in `redirect()`, which throws.
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

  const { name, domain, plan, ownerEmail, confirmOwnerInviteToken } =
    parsed.data;

  const owner = await queries.users.getUserByEmail(ownerEmail);
  if (!owner && !verifyOwnerInviteToken(ownerEmail, confirmOwnerInviteToken)) {
    return {
      ok: false,
      ownerInviteConfirmation: {
        email: ownerEmail,
        token: createOwnerInviteToken(ownerEmail),
        message: `No account found for ${ownerEmail} — they'll be sent an invite to sign in and manage this tenant as owner.`,
      },
    };
  }

  const [existingDomain, domainAvailability] = await Promise.all([
    queries.tenantDomains.getTenantByDomain(domain),
    checkDomainAvailability(domain),
  ]);

  if (existingDomain) {
    return {
      ok: false,
      fieldErrors: { domain: 'This domain is already in use.' },
    };
  }

  // Advisory only: NOT_CONFIGURED/ERROR both mean "can't tell" and fall
  // through unchecked.
  if (domainAvailability === DOMAIN_AVAILABILITY.IN_USE) {
    return {
      ok: false,
      fieldErrors: {
        domain:
          'This domain is already attached to a different Vercel project — free it up there, or use a different domain.',
      },
    };
  }

  let tenantId: string;
  try {
    const result = await queries.tenants.createTenantDraft({
      name,
      domain,
      locale: routing.defaultLocale,
      plan,
      owner: owner
        ? { type: 'user', userId: owner.id }
        : { type: 'invite', email: ownerEmail },
    });

    if (!result.ok) {
      logger.error('tenants.create_draft_failed', {
        domain,
        error: result.error,
      });
      return { ok: false, error: "Couldn't create the tenant — try again." };
    }

    tenantId = result.data.id;
  } catch (error) {
    logger.error('tenants.create_draft_failed', { domain, error });
    return { ok: false, error: "Couldn't create the tenant — try again." };
  }

  await recordAuditEvent({
    logEvent: 'tenants.create_audit_failed',
    action: AUDIT_ACTION.CREATED,
    targetType: AUDIT_TARGET_TYPE.TENANT,
    targetId: tenantId,
    details: { name, domain, plan, ownerEmail },
  });

  // `redirect: false` returns a result instead of throwing, since this
  // action has its own `redirect()` below; a failed send never blocks
  // provisioning.
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

  // The status page reports whatever state provisioning landed in, so every
  // outcome redirects there.
  await startProvisioning(tenantId);

  redirect(adminRoutes.tenantProvisioning(tenantId));
};
