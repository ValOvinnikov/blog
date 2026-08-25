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
 * `workflow_dispatch` trigger for `.github/workflows/deprovision-tenant.yml`.
 * Never throws — every failure (missing token, network error, non-2xx
 * response) is logged and swallowed — but reports success via its return
 * value so the caller can tell whether the workflow was actually requested.
 * `confirm` is re-checked here against the tenant's live slug by the caller
 * before this is ever invoked, but the workflow itself re-validates it
 * independently — this dispatch is a convenience trigger, not the safety
 * boundary.
 */
export const dispatchDeprovisioningWorkflow = async ({
  tenantId,
  confirm,
  dryRun,
}: TDispatchDeprovisioningWorkflowInput): Promise<boolean> => {
  const token = env.TENANT_PROVISIONING_GITHUB_TOKEN;
  const repo = parseTenantProvisioningRepo(env.TENANT_PROVISIONING_GITHUB_REPO);

  if (!token || !repo) {
    logger.error('provisioning.deprovision_dispatch_skipped', { tenantId });
    return false;
  }

  const environment = env.TENANT_PROVISIONING_DATASET;

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
          inputs: {
            tenantId,
            confirm,
            dryRun: String(dryRun),
            ...(environment && { environment }),
          },
        }),
        signal: AbortSignal.timeout(DISPATCH_TIMEOUT_MS),
      },
    );

    if (!response.ok) {
      logger.error('provisioning.deprovision_dispatch_failed', {
        tenantId,
        responseStatus: response.status,
      });
      return false;
    }

    return true;
  } catch (error) {
    logger.error('provisioning.deprovision_dispatch_error', {
      tenantId,
      error,
    });
    return false;
  }
};
