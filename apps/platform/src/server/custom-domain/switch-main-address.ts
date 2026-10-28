import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  ERROR_CODE,
  type TActionResult,
} from '@blog/config';
import { queries } from '@blog/db';
import { toOutcome } from '@blog/utils/to-outcome';
import {
  CUSTOM_DOMAIN_LOG,
  CUSTOM_DOMAIN_REFUSAL,
  type TCustomDomainRefusal,
} from '@platform/constants/custom-domain';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { logger } from '@platform/utils/logger/logger';

export type TSwitchMainAddressResult = TActionResult<
  typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
  never,
  never,
  TCustomDomainRefusal
>;

type TSwitchMainAddressInput = {
  tenantId: string;
  from: string;
  to: string;
};

export const switchMainAddress = async ({
  tenantId,
  from,
  to,
}: TSwitchMainAddressInput): Promise<TSwitchMainAddressResult> => {
  const result = await queries.tenants.setTenantPrimaryDomain(tenantId, to);
  if (!result.ok) {
    if (result.error === ERROR_CODE.DB_NOT_FOUND) {
      return {
        outcome: ACTION_OUTCOME.REFUSED,
        reason: CUSTOM_DOMAIN_REFUSAL.ADDRESS_NOT_FOUND,
      };
    }
    logger.error(CUSTOM_DOMAIN_LOG.MAIN_ADDRESS_FAILED, {
      tenantId,
      domain: to,
      error: result.error,
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }

  await revalidateSiteConfig(tenantId);
  await recordAuditEvent({
    logEvent: CUSTOM_DOMAIN_LOG.MAIN_ADDRESS_AUDIT_FAILED,
    action: AUDIT_ACTION.SETTINGS_UPDATED,
    targetType: AUDIT_TARGET_TYPE.TENANT,
    targetId: tenantId,
    details: { mainAddressChanged: { from, to } },
  });
  return toOutcome(ACTION_OUTCOME.SUCCESS);
};
