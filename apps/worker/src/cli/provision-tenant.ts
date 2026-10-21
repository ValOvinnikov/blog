import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { ERROR_CODE } from '@blog/config/constants';
import { TENANT_PROVISIONING_STATUS } from '@blog/db/constants';
import {
  beginTenantProvisioning,
  setTenantProvisioningStatus,
} from '@blog/db/queries/tenants';
import { sanitizeLogMessage } from '@blog/insight';
import {
  PROVISION_CLI_RESULT,
  type TProvisionCliResult,
} from '@worker/constants/provisioning';
import { logger } from '@worker/utils/logger/logger';
import { runProvisioningSequence } from '@worker/workflows/provisioning-sequence';

export async function provisionTenantOnce(
  tenantId: string,
): Promise<TProvisionCliResult> {
  const began = await beginTenantProvisioning(tenantId);
  if (!began.ok) {
    if (began.error === ERROR_CODE.DB_ALREADY_PROVISIONING) {
      return PROVISION_CLI_RESULT.ALREADY_IN_PROGRESS;
    }
    if (began.error === ERROR_CODE.DB_NOT_FOUND) {
      return PROVISION_CLI_RESULT.NOT_FOUND;
    }
    throw new Error(`beginTenantProvisioning failed: ${began.error}`);
  }

  const ctx = { runId: `cli-${randomUUID()}`, isOneShot: true };
  try {
    const outcome = await runProvisioningSequence(tenantId, ctx);
    return outcome.ok
      ? PROVISION_CLI_RESULT.SUCCEEDED
      : PROVISION_CLI_RESULT.FAILED;
  } catch (error) {
    await setTenantProvisioningStatus(
      tenantId,
      TENANT_PROVISIONING_STATUS.FAILED,
    );
    throw error;
  }
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: { 'tenant-id': { type: 'string' } },
  });
  const tenantId = values['tenant-id'];
  if (!tenantId) {
    logger.error('provisioning.cli_missing_tenant_id', {});
    process.exitCode = 1;
    return;
  }

  try {
    const result = await provisionTenantOnce(tenantId);
    logger.info('provisioning.cli_finished', { tenantId, result });
    if (result === PROVISION_CLI_RESULT.SUCCEEDED) {
      logger.warn('provisioning.cli_owner_access_not_started', { tenantId });
    } else {
      process.exitCode = 1;
    }
  } catch (error) {
    logger.error('provisioning.cli_failed', {
      tenantId,
      error: sanitizeLogMessage(error),
    });
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  void main();
}
