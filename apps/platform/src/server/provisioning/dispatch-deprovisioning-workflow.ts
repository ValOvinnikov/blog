import { PROVISIONING_LOG } from '@platform/constants/provisioning';
import { dispatchGitHubWorkflow } from '@platform/server/github/dispatch-github-workflow';
import { env } from '@platform/utils/env/env';

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
      skipped: PROVISIONING_LOG.DEPROVISION_DISPATCH_SKIPPED,
      failed: PROVISIONING_LOG.DEPROVISION_DISPATCH_FAILED,
      error: PROVISIONING_LOG.DEPROVISION_DISPATCH_ERROR,
    },
    logContext: { tenantId },
  });
