import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config/constants';
import { insertAuditEvent } from '@blog/db/queries/audit-events';
import { sanitizeLogMessage } from '@blog/insight';

import type { TDeprovisionEnv } from './env';

/**
 * Records exactly one `DEPROVISIONED`/`TENANT` audit event after a real
 * archive — the outcome half of the pair the platform app opens with
 * `DEPROVISION_REQUESTED`. Never throws: the archive itself already
 * succeeded by the time this runs, so a lost audit write is logged and
 * swallowed rather than failing a step whose destructive work is already
 * done.
 */
export async function recordDeprovisionAuditEvent(
  tenantId: string,
  env: TDeprovisionEnv,
): Promise<void> {
  if (!env.githubActor) {
    console.error(
      'deprovision-tenant: GITHUB_ACTOR is not set — skipping the deprovision audit event.',
    );
    return;
  }

  try {
    await insertAuditEvent({
      actorId: `github:${env.githubActor}`,
      actorEmail: `${env.githubActor}@users.noreply.github.com`,
      action: AUDIT_ACTION.DEPROVISIONED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: tenantId,
      details: { via: 'deprovision-tenant-workflow', runId: env.githubRunId },
    });
  } catch (error) {
    console.error(
      `deprovision-tenant: failed to record the deprovision audit event for tenant "${tenantId}" (${sanitizeLogMessage(error)}).`,
    );
  }
}
