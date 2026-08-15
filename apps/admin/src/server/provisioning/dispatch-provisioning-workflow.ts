import { env } from '@admin/utils/env/env';
import { sanitizeLogMessage } from '@admin/utils/sanitize-log-message/sanitize-log-message';

const REPO_OWNER = 'ValOvinnikov';
const REPO_NAME = 'blog';
const WORKFLOW_FILE = 'provision-tenant.yml';
const WORKFLOW_REF = 'main';
const DISPATCH_TIMEOUT_MS = 5000;

/**
 * Best-effort `workflow_dispatch` trigger for `.github/workflows/provision-tenant.yml`
 * — the narrowly-scoped (`actions: write` only) exception to this repo's
 * deploy-credentials-stay-in-CI rule (see the tenant-creation-flow design
 * doc's Architecture section). Never throws: a failure here (missing token,
 * network error, the workflow file not existing yet, a non-2xx response) is
 * logged and swallowed — the tenant row this call follows has already been
 * created either way, and an operator can always retry the dispatch later
 * from the tenant's status page.
 */
export async function dispatchProvisioningWorkflow(
  tenantId: string,
): Promise<void> {
  const token = env.TENANT_PROVISIONING_GITHUB_TOKEN;

  if (!token) {
    console.error(
      'Skipped provisioning workflow dispatch: TENANT_PROVISIONING_GITHUB_TOKEN is not configured.',
    );
    return;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ref: WORKFLOW_REF, inputs: { tenantId } }),
        signal: AbortSignal.timeout(DISPATCH_TIMEOUT_MS),
      },
    );

    if (!response.ok) {
      console.error(
        `Provisioning workflow dispatch responded with ${response.status} for tenant "${tenantId}".`,
      );
    }
  } catch (error) {
    console.error(
      'Failed to dispatch the provisioning workflow:',
      sanitizeLogMessage(error),
    );
  }
}
