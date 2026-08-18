import { env } from '@admin/utils/env/env';
import { logger } from '@admin/utils/logger/logger';
import { parseTenantProvisioningRepo } from '@admin/utils/tenant-provisioning-repo/tenant-provisioning-repo';

const WORKFLOW_FILE = 'provision-tenant.yml';
const WORKFLOW_REF = 'main';
const DISPATCH_TIMEOUT_MS = 5000;

/**
 * Best-effort `workflow_dispatch` trigger for `.github/workflows/provision-tenant.yml`
 * — a deliberate, narrowly-scoped (`actions: write` only) exception to
 * keeping deploy-adjacent credentials inside CI: only the trigger crosses
 * into application code here, never the provisioning work itself. Never
 * throws: a failure here (missing token, network error, the workflow file
 * not existing yet, a non-2xx response) is logged and swallowed — the
 * tenant row this call follows has already been created either way, and an
 * operator can always retry the dispatch later from the tenant's status
 * page.
 */
export async function dispatchProvisioningWorkflow(
  tenantId: string,
): Promise<void> {
  const token = env.TENANT_PROVISIONING_GITHUB_TOKEN;
  const repo = parseTenantProvisioningRepo(env.TENANT_PROVISIONING_GITHUB_REPO);

  if (!token || !repo) {
    logger.error('provisioning.dispatch_skipped', { tenantId });
    return;
  }

  // Local-dev-only: forwarded as the workflow's `adminAppBaseUrl` input only
  // when set, so a real (production) dispatch never sends this key and CI's
  // `inputs.adminAppBaseUrl || vars.ADMIN_APP_BASE_URL` fallback is untouched.
  const adminAppBaseUrlOverride =
    env.TENANT_PROVISIONING_ADMIN_BASE_URL_OVERRIDE;

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
    }
  } catch (error) {
    logger.error('provisioning.dispatch_error', { tenantId, error });
  }
}
