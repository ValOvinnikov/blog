import { env } from '@admin/utils/env/env';
import { logger } from '@admin/utils/logger/logger';
import { parseTenantProvisioningRepo } from '@admin/utils/tenant-provisioning-repo/tenant-provisioning-repo';

const WORKFLOW_FILE = 'deprovision-tenant.yml';
const WORKFLOW_REF = 'main';
const DISPATCH_TIMEOUT_MS = 5000;

export type TDispatchDeprovisioningWorkflowInput = {
  tenantId: string;
  confirm: string;
  dryRun: boolean;
};

/**
 * Best-effort `workflow_dispatch` trigger for
 * `.github/workflows/deprovision-tenant.yml`, mirroring
 * `dispatchProvisioningWorkflow`'s posture: never throws, a failure here
 * (missing token, network error, non-2xx response) is logged and swallowed.
 * `confirm` is re-checked here against the tenant's live slug by the caller
 * before this is ever invoked, but the workflow itself re-validates it
 * independently — this dispatch is a convenience trigger, not the safety
 * boundary.
 */
export async function dispatchDeprovisioningWorkflow({
  tenantId,
  confirm,
  dryRun,
}: TDispatchDeprovisioningWorkflowInput): Promise<void> {
  const token = env.TENANT_PROVISIONING_GITHUB_TOKEN;
  const repo = parseTenantProvisioningRepo(env.TENANT_PROVISIONING_GITHUB_REPO);

  if (!token || !repo) {
    logger.error('provisioning.deprovision_dispatch_skipped', { tenantId });
    return;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${repo.owner}/${repo.repo}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: WORKFLOW_REF,
          inputs: { tenantId, confirm, dryRun: String(dryRun) },
        }),
        signal: AbortSignal.timeout(DISPATCH_TIMEOUT_MS),
      },
    );

    if (!response.ok) {
      logger.error('provisioning.deprovision_dispatch_failed', {
        tenantId,
        responseStatus: response.status,
      });
    }
  } catch (error) {
    logger.error('provisioning.deprovision_dispatch_error', {
      tenantId,
      error,
    });
  }
}
