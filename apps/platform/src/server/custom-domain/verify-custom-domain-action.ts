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
import { isUndefined } from '@blog/utils/primitives';
import { toOutcome } from '@blog/utils/to-outcome';
import {
  CUSTOM_DOMAIN_FIELD_ERROR,
  CUSTOM_DOMAIN_LOG,
  CUSTOM_DOMAIN_REFUSAL,
  type TCustomDomainFieldError,
  type TCustomDomainRefusal,
} from '@platform/constants/custom-domain';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantOwner } from '@platform/server/auth/require-tenant-owner';
import { enqueueCustomDomainConnectOrUndo } from '@platform/server/custom-domain/enqueue-custom-domain-connect-or-undo';
import { lookupTxtRecords } from '@platform/server/custom-domain/lookup-txt-records';
import { restoreClaimAfterRejection } from '@platform/server/custom-domain/restore-claim-after-rejection';
import { customDomainTxtName } from '@platform/utils/custom-domain-txt-name/custom-domain-txt-name';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';

export type TVerifyCustomDomainResult = TActionResult<
  typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
  'domain',
  TCustomDomainFieldError,
  TCustomDomainRefusal
>;

const refused = (reason: TCustomDomainRefusal): TVerifyCustomDomainResult => ({
  outcome: ACTION_OUTCOME.REFUSED,
  reason,
});

export const verifyCustomDomainAction = async (
  tenantId: string,
): Promise<TVerifyCustomDomainResult> => {
  const { tenant } = await requireTenantOwner(tenantId);
  const { id, plan, deprovisionedAt } = tenant;

  if (deprovisionedAt) return refused(CUSTOM_DOMAIN_REFUSAL.ARCHIVED);
  if (plan !== TENANT_PLAN.GROWTH) {
    return refused(CUSTOM_DOMAIN_REFUSAL.NOT_ON_PLAN);
  }

  try {
    const claim = await queries.customDomainClaims.getCustomDomainClaim(id);
    if (isUndefined(claim)) {
      return refused(CUSTOM_DOMAIN_REFUSAL.NO_PENDING_CLAIM);
    }
    const { id: claimId, domain, token } = claim;

    let records: string[];
    try {
      records = await lookupTxtRecords(customDomainTxtName(domain));
    } catch (error) {
      logger.error(CUSTOM_DOMAIN_LOG.VERIFY_LOOKUP_FAILED, {
        tenantId: id,
        domain,
        ...toLoggableError(error),
      });
      return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
    }
    if (!records.includes(token)) {
      return refused(CUSTOM_DOMAIN_REFUSAL.RECORD_NOT_FOUND);
    }

    const promoted = await queries.customDomainClaims.promoteCustomDomainClaim(
      id,
      claimId,
    );
    if (!promoted.ok) {
      if (promoted.error === ERROR_CODE.DB_DUPLICATE_DOMAIN) {
        return {
          outcome: ACTION_OUTCOME.INVALID,
          fieldErrors: {
            domain: { reason: CUSTOM_DOMAIN_FIELD_ERROR.DOMAIN_TAKEN },
          },
        };
      }
      if (promoted.error === ERROR_CODE.DB_NOT_FOUND) {
        return refused(CUSTOM_DOMAIN_REFUSAL.NO_PENDING_CLAIM);
      }
      logger.error(CUSTOM_DOMAIN_LOG.VERIFY_FAILED, {
        tenantId: id,
        domain,
        error: promoted.error,
      });
      return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
    }

    const attempt = await enqueueCustomDomainConnectOrUndo(id, domain);
    if (!attempt.isAccepted) {
      const isRestored =
        attempt.isUndone &&
        (await restoreClaimAfterRejection(id, domain, token));
      return isRestored
        ? refused(attempt.reason)
        : toOutcome(ACTION_OUTCOME.SERVER_ERROR);
    }

    await recordAuditEvent({
      logEvent: CUSTOM_DOMAIN_LOG.VERIFY_AUDIT_FAILED,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: id,
      details: { customDomainConnectRequested: domain },
    });
    return toOutcome(ACTION_OUTCOME.SUCCESS);
  } catch (error) {
    logger.error(CUSTOM_DOMAIN_LOG.VERIFY_FAILED, {
      tenantId: id,
      ...toLoggableError(error),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
