import {
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  GITHUB_AUDIT_ACTOR_ID_PREFIX,
} from '@blog/config/constants';
import { insertAuditEvent } from '@blog/db/queries/audit-events';
import type { TTenantReaderDataCounts } from '@blog/db/queries/reader-data';
import { sanitizeLogMessage } from '@blog/insight';

import type { TDeprovisionEnv } from './env';

export async function recordReaderDataPurgeAuditEvent(
  tenantId: string,
  env: TDeprovisionEnv,
  counts: TTenantReaderDataCounts,
): Promise<void> {
  if (!env.githubActor) {
    console.error(
      'deprovision-tenant: GITHUB_ACTOR is not set — skipping the reader-data-purge audit event.',
    );
    return;
  }

  try {
    await insertAuditEvent({
      actorId: `${GITHUB_AUDIT_ACTOR_ID_PREFIX}${env.githubActor}`,
      action: AUDIT_ACTION.READER_DATA_PURGED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: tenantId,
      details: {
        via: 'deprovision-tenant-workflow',
        runId: env.githubRunId,
        ...counts,
      },
    });
  } catch (error) {
    console.error(
      `deprovision-tenant: failed to record the reader-data-purge audit event for tenant "${tenantId}" (${sanitizeLogMessage(error)}).`,
    );
  }
}
