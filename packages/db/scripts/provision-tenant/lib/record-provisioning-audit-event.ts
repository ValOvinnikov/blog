import { AUDIT_TARGET_TYPE, type TAuditAction } from '@blog/config/constants';
import type { TTenantProvisioningStep } from '@blog/db/constants';
import { insertAuditEvent } from '@blog/db/queries/audit-events';
import { sanitizeLogMessage } from '@blog/insight';

import type { TProvisionEnv } from './env';

/**
 * Records exactly one `TENANT` audit event for a provisioning run's outcome
 * — `PROVISIONED` on success, `PROVISIONING_FAILED` for any failure exit —
 * attributing it to the GitHub actor who dispatched the workflow.
 */
export async function recordProvisioningAuditEvent(
  tenantId: string,
  env: TProvisionEnv,
  action: TAuditAction,
  failedStep?: TTenantProvisioningStep,
): Promise<void> {
  if (!env.githubActor) {
    console.error(
      'provision-tenant: GITHUB_ACTOR is not set — skipping the provisioning audit event.',
    );
    return;
  }

  try {
    await insertAuditEvent({
      actorId: `github:${env.githubActor}`,
      actorEmail: `${env.githubActor}@users.noreply.github.com`,
      action,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: tenantId,
      details: {
        via: 'provision-tenant-workflow',
        runId: env.githubRunId,
        ...(failedStep === undefined ? {} : { step: failedStep }),
      },
    });
  } catch (error) {
    console.error(
      `provision-tenant: failed to record the provisioning audit event for tenant "${tenantId}" (${sanitizeLogMessage(error)}).`,
    );
  }
}
