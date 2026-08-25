import { env } from '@admin/utils/env/env';
import { logger } from '@admin/utils/logger/logger';
import { parseTenantProvisioningRepo } from '@admin/utils/tenant-provisioning-repo/tenant-provisioning-repo';

const WORKFLOW_FILE = 'provision-tenant.yml';
const WORKFLOW_REF = 'main';
const DISPATCH_TIMEOUT_MS = 5000;

/**
 * `workflow_dispatch` trigger for `.github/workflows/provision-tenant.yml` —
 * a deliberate, narrowly-scoped (`actions: write` only) exception to keeping
 * deploy-adjacent credentials inside CI: only the trigger crosses into
 * application code here, never the provisioning work itself. Never throws:
 * a failure here (missing token, network error, the workflow file not
 * existing yet, a non-2xx response) is logged and swallowed — but reported
 * via the return value so the caller can revert the `PROVISIONING` status
 * transition it made before dispatching, rather than leaving the tenant
 * stuck showing a workflow that never actually started.
 */
export const dispatchProvisioningWorkflow = async (
  tenantId: string,
): Promise<boolean> => {
  const token = env.TENANT_PROVISIONING_GITHUB_TOKEN;
  const repo = parseTenantProvisioningRepo(env.TENANT_PROVISIONING_GITHUB_REPO);

  if (!token || !repo) {
    logger.error('provisioning.dispatch_skipped', { tenantId });
    return false;
  }

  // Local-dev-only: forwarded as the workflow's `adminAppBaseUrl` input only
  // when set, so a real (production) dispatch never sends this key and CI's
  // `inputs.adminAppBaseUrl || vars.ADMIN_APP_BASE_URL` fallback is untouched.
  const adminAppBaseUrlOverride =
    env.TENANT_PROVISIONING_ADMIN_BASE_URL_OVERRIDE;

  // The base-url override always implies a local test run, so it forces
  // `development` regardless of TENANT_PROVISIONING_DATASET — a safety net
  // against ever creating a `production`-dataset Sanity project by accident.
  // Also forwarded as the workflow's `environment` input so the tenant
  // registry it dispatches against always matches this Sanity dataset.
  const tenantSanityDataset = adminAppBaseUrlOverride
    ? 'development'
    : env.TENANT_PROVISIONING_DATASET;

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
            ...(adminAppBaseUrlOverride && {
              adminAppBaseUrl: adminAppBaseUrlOverride,
            }),
            ...(tenantSanityDataset && { tenantSanityDataset }),
            ...(tenantSanityDataset && { environment: tenantSanityDataset }),
          },
        }),
        signal: AbortSignal.timeout(DISPATCH_TIMEOUT_MS),
      },
    );

    if (!response.ok) {
      logger.error('provisioning.dispatch_failed', {
        tenantId,
        responseStatus: response.status,
      });
      return false;
    }

    return true;
  } catch (error) {
    logger.error('provisioning.dispatch_error', { tenantId, error });
    return false;
  }
};
