'use server';

import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  HTTP_STATUS,
  type TActionResult,
} from '@blog/config';
import { queries } from '@blog/db';
import { toOutcome } from '@blog/utils/to-outcome';
import {
  CUSTOM_DOMAIN_LOG,
  CUSTOM_DOMAIN_PATH,
  CUSTOM_DOMAIN_REFUSAL,
  type TCustomDomainRefusal,
} from '@platform/constants/custom-domain';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantOwner } from '@platform/server/auth/require-tenant-owner';
import { enqueueWorkerRequest } from '@platform/server/provisioning/enqueue-provisioning';
import { env } from '@platform/utils/env/env';
import { findCustomDomain } from '@platform/utils/find-custom-domain/find-custom-domain';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';

import {
  customDomainInputSchema,
  type TCustomDomainInput,
} from './custom-domain-input';

export type TRemoveCustomDomainResult = TActionResult<
  typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
  'domain',
  never,
  TCustomDomainRefusal
>;

const refused = (reason: TCustomDomainRefusal): TRemoveCustomDomainResult => ({
  outcome: ACTION_OUTCOME.REFUSED,
  reason,
});

export const removeCustomDomainAction = async (
  tenantId: string,
  input: TCustomDomainInput,
): Promise<TRemoveCustomDomainResult> => {
  const { tenant } = await requireTenantOwner(tenantId);

  const parsed = customDomainInputSchema.safeParse(input);
  if (!parsed.success) {
    return { outcome: ACTION_OUTCOME.INVALID, fieldErrors: {} };
  }
  const { domain } = parsed.data;
  const { id, deprovisionedAt, primaryDomain } = tenant;

  if (deprovisionedAt) return refused(CUSTOM_DOMAIN_REFUSAL.ARCHIVED);

  try {
    const customDomain = findCustomDomain(
      await queries.tenantDomains.listTenantDomains(id),
      primaryDomain,
      env.TENANT_ROOT_DOMAIN,
    );
    if (domain === primaryDomain || domain !== customDomain) {
      return refused(CUSTOM_DOMAIN_REFUSAL.NOT_CUSTOM_DOMAIN);
    }

    if (!(await queries.tenantDomains.removeTenantDomain(id, domain))) {
      return refused(CUSTOM_DOMAIN_REFUSAL.NOT_CUSTOM_DOMAIN);
    }

    const status = await enqueueWorkerRequest(
      CUSTOM_DOMAIN_PATH.DISCONNECT,
      id,
      domain,
    );
    const isDisconnectAccepted = status === HTTP_STATUS.ACCEPTED;
    if (!isDisconnectAccepted) {
      logger.error(CUSTOM_DOMAIN_LOG.DISCONNECT_ENQUEUE_REJECTED, {
        tenantId: id,
        domain,
        responseStatus: status,
      });
    }

    await recordAuditEvent({
      logEvent: CUSTOM_DOMAIN_LOG.DISCONNECT_AUDIT_FAILED,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: id,
      details: { customDomainRemoved: domain, isDisconnectAccepted },
    });
    return toOutcome(ACTION_OUTCOME.SUCCESS);
  } catch (error) {
    logger.error(CUSTOM_DOMAIN_LOG.DISCONNECT_FAILED, {
      tenantId: id,
      domain,
      ...toLoggableError(error),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
