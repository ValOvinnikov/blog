import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config/constants';
import { insertAuditEvent } from '@blog/db/queries/audit-events';
import { sanitizeLogMessage } from '@blog/insight';

import type { TDeprovisionEnv } from './env';

export type TReaderDataPurgeCounts = {
  subscribers: number;
  bookmarks: number;
  membershipInvites: number;
};

// Records exactly one `READER_DATA_PURGED`/`TENANT` audit event after a real
// purge. Never throws: the purge itself already succeeded by the time this
// runs, so a lost audit write is logged and swallowed rather than failing a
// step whose destructive work is already done — mirrors
// `recordDeprovisionAuditEvent`.
export async function recordReaderDataPurgeAuditEvent(
  tenantId: string,
  env: TDeprovisionEnv,
  counts: TReaderDataPurgeCounts,
): Promise<void> {
  if (!env.githubActor) {
    console.error(
      'deprovision-tenant: GITHUB_ACTOR is not set — skipping the reader-data-purge audit event.',
    );
    return;
  }

  try {
    await insertAuditEvent({
      actorId: `github:${env.githubActor}`,
      actorEmail: `${env.githubActor}@users.noreply.github.com`,
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
