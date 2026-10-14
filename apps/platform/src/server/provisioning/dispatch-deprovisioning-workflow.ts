import { env } from '@platform/utils/env/env';

import { dispatchGitHubWorkflow } from './dispatch-github-workflow';

const WORKFLOW_FILE = 'deprovision-tenant.yml';

export type TDispatchDeprovisioningWorkflowInput = {
  tenantId: string;
  confirm: string;
  dryRun: boolean;
};

/** The workflow re-validates `confirm` itself; this dispatch is a trigger, not the safety boundary. */
export const dispatchDeprovisioningWorkflow = async ({
  tenantId,
  confirm,
  dryRun,
}: TDispatchDeprovisioningWorkflowInput): Promise<boolean> =>
  dispatchGitHubWorkflow({
    workflowFile: WORKFLOW_FILE,
    inputs: {
      tenantId,
      confirm,
      dryRun: String(dryRun),
      environment: env.TENANT_PROVISIONING_DATASET,
    },
    logEvents: {
      skipped: 'provisioning.deprovision_dispatch_skipped',
      failed: 'provisioning.deprovision_dispatch_failed',
      error: 'provisioning.deprovision_dispatch_error',
    },
    logContext: { tenantId },
  });
