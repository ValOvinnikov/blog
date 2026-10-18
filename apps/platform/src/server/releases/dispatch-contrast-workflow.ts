import { CONTRAST_WORKFLOW_FILE } from '@platform/constants/release';
import { dispatchGitHubWorkflow } from '@platform/server/github/dispatch-github-workflow';

export const dispatchContrastWorkflow = (): Promise<boolean> =>
  dispatchGitHubWorkflow({
    workflowFile: CONTRAST_WORKFLOW_FILE,
    inputs: {},
    logEvents: {
      skipped: 'releases.contrast_dispatch_skipped',
      failed: 'releases.contrast_dispatch_failed',
      error: 'releases.contrast_dispatch_error',
    },
    logContext: {},
  });
