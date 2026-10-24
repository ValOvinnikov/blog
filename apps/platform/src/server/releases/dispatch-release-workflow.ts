import {
  RELEASE_WORKFLOW_FILE,
  RELEASE_LOG,
} from '@platform/constants/release';
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
      skipped: RELEASE_LOG.RELEASE_DISPATCH_SKIPPED,
      failed: RELEASE_LOG.RELEASE_DISPATCH_FAILED,
      error: RELEASE_LOG.RELEASE_DISPATCH_ERROR,
    },
    logContext: { version, isOverride },
  });
