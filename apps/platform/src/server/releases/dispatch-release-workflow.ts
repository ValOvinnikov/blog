import { RELEASE_WORKFLOW_FILE } from '@platform/constants/release';
import { dispatchGitHubWorkflow } from '@platform/server/github/dispatch-github-workflow';

type TDispatchReleaseWorkflowInput = {
  version: string;
  isOverride: boolean;
};

export const dispatchReleaseWorkflow = ({
  version,
  isOverride,
}: TDispatchReleaseWorkflowInput): Promise<boolean> =>
  dispatchGitHubWorkflow({
    workflowFile: RELEASE_WORKFLOW_FILE,
    inputs: { version, override: String(isOverride) },
    logEvents: {
      skipped: 'releases.release_dispatch_skipped',
      failed: 'releases.release_dispatch_failed',
      error: 'releases.release_dispatch_error',
    },
    logContext: { version, isOverride },
  });
