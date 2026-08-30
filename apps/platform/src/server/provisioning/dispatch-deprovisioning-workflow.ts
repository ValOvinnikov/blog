import { dispatchGitHubWorkflow } from '@platform/utils/dispatch-github-workflow/dispatch-github-workflow';
import { env } from '@platform/utils/env/env';

const WORKFLOW_FILE = 'deprovision-tenant.yml';

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
