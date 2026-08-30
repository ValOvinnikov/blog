import { dispatchGitHubWorkflow } from '@platform/utils/dispatch-github-workflow/dispatch-github-workflow';
import { env } from '@platform/utils/env/env';

const WORKFLOW_FILE = 'provision-tenant.yml';

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
  const adminAppBaseUrlOverride =
    env.TENANT_PROVISIONING_ADMIN_BASE_URL_OVERRIDE;

  // Local-dev-only: forces the `development` dataset regardless of
  // TENANT_PROVISIONING_DATASET, as a safety net against ever creating a
  // `production`-dataset Sanity project by accident.
  const tenantSanityDataset = adminAppBaseUrlOverride
    ? 'development'
    : env.TENANT_PROVISIONING_DATASET;

  return dispatchGitHubWorkflow({
    workflowFile: WORKFLOW_FILE,
    inputs: {
      tenantId,
      adminAppBaseUrl: adminAppBaseUrlOverride,
      tenantSanityDataset,
      environment: tenantSanityDataset,
    },
    logEvents: {
      skipped: 'provisioning.dispatch_skipped',
      failed: 'provisioning.dispatch_failed',
      error: 'provisioning.dispatch_error',
    },
    logContext: { tenantId },
  });
};
