import {
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  GITHUB_AUDIT_ACTOR_ID_PREFIX,
} from '@blog/config/constants';
import { DEPROVISIONING_WORKFLOW_AUDIT_VIA } from '@blog/db/constants';
import { insertAuditEvent } from '@blog/db/queries/audit-events';
import { sanitizeLogMessage } from '@blog/insight';

import type { TDeprovisionEnv } from './env';

// Never throws: the archive has already succeeded, so a lost audit write is
// logged and swallowed.
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
      actorId: `${GITHUB_AUDIT_ACTOR_ID_PREFIX}${env.githubActor}`,
      action: AUDIT_ACTION.DEPROVISIONED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: tenantId,
      details: {
        via: DEPROVISIONING_WORKFLOW_AUDIT_VIA,
        runId: env.githubRunId,
      },
    });
  } catch (error) {
    console.error(
      `deprovision-tenant: failed to record the deprovision audit event for tenant "${tenantId}" (${sanitizeLogMessage(error)}).`,
    );
  }
}
