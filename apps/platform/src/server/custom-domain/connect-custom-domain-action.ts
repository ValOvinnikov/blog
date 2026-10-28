'use server';

import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  ERROR_CODE,
  type TActionResult,
} from '@blog/config';
import { queries } from '@blog/db';
import { TENANT_PLAN } from '@blog/db/constants';
import { toOutcome } from '@blog/utils/to-outcome';
import {
  CUSTOM_DOMAIN_FIELD_ERROR,
  CUSTOM_DOMAIN_LOG,
  CUSTOM_DOMAIN_REFUSAL,
  type TCustomDomainFieldError,
  type TCustomDomainRefusal,
} from '@platform/constants/custom-domain';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { enqueueCustomDomainConnectOrUndo } from '@platform/server/custom-domain/enqueue-custom-domain-connect-or-undo';
import { env } from '@platform/utils/env/env';
import { findCustomDomain } from '@platform/utils/find-custom-domain/find-custom-domain';
import { isPlatformAddress } from '@platform/utils/is-platform-address/is-platform-address';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';

import {
  customDomainInputSchema,
  type TCustomDomainInput,
} from './custom-domain-input';

export type TConnectCustomDomainResult = TActionResult<
  typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
  'domain',
  TCustomDomainFieldError,
  TCustomDomainRefusal
>;

const fieldError = (
  reason: TCustomDomainFieldError,
): TConnectCustomDomainResult => ({
  outcome: ACTION_OUTCOME.INVALID,
  fieldErrors: { domain: { reason } },
});

const refused = (reason: TCustomDomainRefusal): TConnectCustomDomainResult => ({
  outcome: ACTION_OUTCOME.REFUSED,
  reason,
});

export const connectCustomDomainAction = async (
  tenantId: string,
  input: TCustomDomainInput,
): Promise<TConnectCustomDomainResult> => {
  const { tenant } = await requireTenantMembership(tenantId);

  const parsed = customDomainInputSchema.safeParse(input);
  if (!parsed.success) {
    return fieldError(CUSTOM_DOMAIN_FIELD_ERROR.DOMAIN_INVALID);
  }
  const { domain } = parsed.data;
  const { id, plan, deprovisionedAt, sanityProjectId, primaryDomain } = tenant;

  if (deprovisionedAt) return refused(CUSTOM_DOMAIN_REFUSAL.ARCHIVED);
  if (plan !== TENANT_PLAN.GROWTH) {
    return refused(CUSTOM_DOMAIN_REFUSAL.NOT_ON_PLAN);
  }
  if (!sanityProjectId) return refused(CUSTOM_DOMAIN_REFUSAL.NOT_PROVISIONED);
  if (isPlatformAddress(domain, env.TENANT_ROOT_DOMAIN)) {
    return fieldError(CUSTOM_DOMAIN_FIELD_ERROR.DOMAIN_PLATFORM_ADDRESS);
  }

  try {
    if (await queries.tenantDomains.isDomainHeldByAnyTenant(domain)) {
      return fieldError(CUSTOM_DOMAIN_FIELD_ERROR.DOMAIN_TAKEN);
    }

    const existing = findCustomDomain(
      await queries.tenantDomains.listTenantDomains(id),
      primaryDomain,
      env.TENANT_ROOT_DOMAIN,
    );
    if (existing) return refused(CUSTOM_DOMAIN_REFUSAL.ALREADY_CONNECTED);

    const added = await queries.tenantDomains.addTenantDomain(id, domain);
    if (!added.ok) {
      if (added.error === ERROR_CODE.DB_DUPLICATE_DOMAIN) {
        return fieldError(CUSTOM_DOMAIN_FIELD_ERROR.DOMAIN_TAKEN);
      }
      logger.error(CUSTOM_DOMAIN_LOG.CONNECT_FAILED, {
        tenantId: id,
        domain,
        error: added.error,
      });
      return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
    }

    if (!(await enqueueCustomDomainConnectOrUndo(id, domain))) {
      return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
    }

    await recordAuditEvent({
      logEvent: CUSTOM_DOMAIN_LOG.CONNECT_AUDIT_FAILED,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: id,
      details: { customDomainConnectRequested: domain },
    });
    return toOutcome(ACTION_OUTCOME.SUCCESS);
  } catch (error) {
    logger.error(CUSTOM_DOMAIN_LOG.CONNECT_FAILED, {
      tenantId: id,
      domain,
      ...toLoggableError(error),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
