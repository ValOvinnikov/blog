'use server';

import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  DOMAIN_LABEL_PATTERN,
  type TActionResult,
  type TOutcome,
  type TReasonedFailure,
} from '@blog/config';
import { queries, TENANT_PLAN } from '@blog/db';
import { toOutcome } from '@blog/utils/to-outcome';
import { DOMAIN_AVAILABILITY } from '@platform/constants/domain';
import {
  TENANT_FIELD_ERROR,
  TENANT_REFUSAL,
  TENANT_LOG,
} from '@platform/constants/tenant';
import { routing } from '@platform/i18n/routing';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireAdmin } from '@platform/server/auth/require-admin';
import { checkDomainAvailability } from '@platform/server/provisioning/check-domain-availability';
import { startProvisioning } from '@platform/server/provisioning/start-provisioning';
import { checkTenantSlug } from '@platform/server/tenants/check-tenant-slug';
import {
  createOwnerInviteToken,
  verifyOwnerInviteToken,
} from '@platform/server/tenants/owner-invite-token';
import { sendOwnerInviteEmail } from '@platform/server/tenants/send-owner-invite-email';
import {
  toTenantFieldErrors,
  type TTenantDetailsFieldError,
} from '@platform/server/tenants/tenant-field-error';
import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';
import { adminRoutes } from '@platform/utils/routes/routes';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const createTenantInputSchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().toLowerCase().regex(DOMAIN_LABEL_PATTERN),
  plan: z.enum(TENANT_PLAN),
  ownerEmail: z.string().trim().toLowerCase().email(),
  confirmOwnerInviteToken: z.string().optional(),
});

export type TCreateTenantInput = z.input<typeof createTenantInputSchema>;

export type TOwnerInviteConfirmation = { email: string; token: string };

export type TCreateTenantResult =
  | TActionResult<
      typeof ACTION_OUTCOME.SERVER_ERROR,
      keyof TCreateTenantInput,
      TTenantDetailsFieldError
    >
  | (TOutcome<typeof ACTION_OUTCOME.REFUSED> &
      TReasonedFailure<typeof TENANT_REFUSAL.OWNER_INVITE_UNCONFIRMED> &
      TOwnerInviteConfirmation);

export const createTenantAction = async (
  input: TCreateTenantInput,
): Promise<TCreateTenantResult> => {
  await requireAdmin();

  const parsed = createTenantInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: toTenantFieldErrors<keyof TCreateTenantInput>(
        parsed.error.issues,
        {
          name: TENANT_FIELD_ERROR.NAME_REQUIRED,
          slug: TENANT_FIELD_ERROR.SLUG_INVALID,
          plan: TENANT_FIELD_ERROR.PLAN_UNSUPPORTED,
          ownerEmail: TENANT_FIELD_ERROR.EMAIL_INVALID,
        },
      ),
    };
  }

  const rootDomain = env.TENANT_ROOT_DOMAIN;
  if (!rootDomain) {
    logger.error(TENANT_LOG.ROOT_DOMAIN_MISSING);
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }

  const { name, slug, plan, ownerEmail, confirmOwnerInviteToken } = parsed.data;
  const domain = `${slug}.${rootDomain}`;

  const owner = await queries.users.getUserByEmail(ownerEmail);
  if (!owner && !verifyOwnerInviteToken(ownerEmail, confirmOwnerInviteToken)) {
    return {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.OWNER_INVITE_UNCONFIRMED,
      email: ownerEmail,
      token: createOwnerInviteToken(ownerEmail),
    };
  }

  const slugError = await checkTenantSlug(slug, rootDomain);
  if (slugError) {
    return {
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { slug: { reason: slugError } },
    };
  }

  if ((await checkDomainAvailability(domain)) === DOMAIN_AVAILABILITY.IN_USE) {
    return {
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        slug: { reason: TENANT_FIELD_ERROR.DOMAIN_ATTACHED_ELSEWHERE },
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
      logger.error(TENANT_LOG.CREATE_DRAFT_FAILED, {
        domain,
        error: result.error,
      });
      return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
    }

    tenantId = result.data.id;
  } catch (error) {
    logger.error(TENANT_LOG.CREATE_DRAFT_FAILED, { domain, error });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }

  await recordAuditEvent({
    logEvent: TENANT_LOG.CREATE_AUDIT_FAILED,
    action: AUDIT_ACTION.CREATED,
    targetType: AUDIT_TARGET_TYPE.TENANT,
    targetId: tenantId,
    details: { name, domain, plan, ownerUserId: owner?.id ?? null },
  });

  if (!owner) {
    await sendOwnerInviteEmail(tenantId, ownerEmail);
  }

  await startProvisioning(tenantId);

  redirect(adminRoutes.tenantProvisioning(tenantId));
};
