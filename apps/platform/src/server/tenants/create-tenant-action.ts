'use server';

import { AUDIT_ACTION, AUDIT_TARGET_TYPE, DOMAIN_PATTERN } from '@blog/config';
import { queries, TENANT_PLAN } from '@blog/db';
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
import {
  toTenantFieldErrors,
  type TTenantFieldError,
} from '@platform/server/tenants/tenant-field-error';
import { logger } from '@platform/utils/logger/logger';
import { adminRoutes } from '@platform/utils/routes/routes';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const createTenantInputSchema = z.object({
  name: z.string().trim().min(1),
  domain: z.string().trim().toLowerCase().regex(DOMAIN_PATTERN),
  plan: z.enum(TENANT_PLAN),
  ownerEmail: z.string().trim().toLowerCase().email(),
  confirmOwnerInviteToken: z.string().optional(),
});

export type TCreateTenantInput = z.input<typeof createTenantInputSchema>;

export type TCreateTenantFieldErrors = Partial<
  Record<keyof TCreateTenantInput, TTenantFieldError>
>;

export type TCreateTenantResult = {
  ok: false;
  error?: 'createFailed';
  fieldErrors?: TCreateTenantFieldErrors;
  ownerInviteConfirmation?: { email: string; token: string };
};

export const createTenantAction = async (
  input: TCreateTenantInput,
): Promise<TCreateTenantResult> => {
  await requireAdmin();

  const parsed = createTenantInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: toTenantFieldErrors<keyof TCreateTenantInput>(
        parsed.error.issues,
        {
          name: 'nameRequired',
          domain: 'domainInvalid',
          plan: 'planUnsupported',
          ownerEmail: 'emailInvalid',
        },
      ),
    };
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
      fieldErrors: { domain: { reason: 'domainTaken' } },
    };
  }

  if (domainAvailability === DOMAIN_AVAILABILITY.IN_USE) {
    return {
      ok: false,
      fieldErrors: { domain: { reason: 'domainAttachedElsewhere' } },
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
      return { ok: false, error: 'createFailed' };
    }

    tenantId = result.data.id;
  } catch (error) {
    logger.error('tenants.create_draft_failed', { domain, error });
    return { ok: false, error: 'createFailed' };
  }

  await recordAuditEvent({
    logEvent: 'tenants.create_audit_failed',
    action: AUDIT_ACTION.CREATED,
    targetType: AUDIT_TARGET_TYPE.TENANT,
    targetId: tenantId,
    details: { name, domain, plan, ownerEmail },
  });

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

  await startProvisioning(tenantId);

  redirect(adminRoutes.tenantProvisioning(tenantId));
};
