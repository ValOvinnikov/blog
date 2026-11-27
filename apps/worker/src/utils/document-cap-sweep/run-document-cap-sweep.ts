import { listActiveTenants } from '@shinefold/db/queries/tenants';
import { sanitizeLogMessage } from '@shinefold/insight';
import {
  DOCUMENT_CAP_CHECK,
  DOCUMENT_CAP_LOG,
} from '@worker/constants/document-cap';
import { logger } from '@worker/utils/logger/logger';

import { checkTenantDocumentCap } from './check-tenant-document-cap';

export type TDocumentCapSweepResult = {
  checked: number;
  nearing: number;
  failed: number;
};

export async function runDocumentCapSweep(): Promise<TDocumentCapSweepResult> {
  const tenants = await listActiveTenants();
  const result: TDocumentCapSweepResult = { checked: 0, nearing: 0, failed: 0 };

  for (const tenant of tenants) {
    try {
      const outcome = await checkTenantDocumentCap(tenant);
      if (outcome === DOCUMENT_CAP_CHECK.SKIPPED) continue;
      result.checked++;
      if (outcome === DOCUMENT_CAP_CHECK.NEARING) result.nearing++;
    } catch (error) {
      result.failed++;
      logger.error(DOCUMENT_CAP_LOG.SWEEP_TENANT_FAILED, {
        tenantId: tenant.id,
        error: sanitizeLogMessage(error),
      });
    }
  }

  logger.info(DOCUMENT_CAP_LOG.SWEEP_FINISHED, result);
  return result;
}
