import { env } from '@platform/utils/env/env';

import { dispatchGitHubWorkflow } from './dispatch-github-workflow';

const WORKFLOW_FILE = 'provision-tenant.yml';

/** Only the trigger crosses into app code, with an `actions: write`-only token; the provisioning work stays in CI. */
export const dispatchProvisioningWorkflow = async (
  tenantId: string,
): Promise<boolean> => {
  const adminAppBaseUrlOverride =
    env.TENANT_PROVISIONING_ADMIN_BASE_URL_OVERRIDE;

  // A local-dev override always forces `development`, so a dev run can never create a `production` dataset.
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
