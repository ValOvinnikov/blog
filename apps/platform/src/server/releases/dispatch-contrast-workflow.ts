import {
  CONTRAST_WORKFLOW_FILE,
  RELEASE_LOG,
} from '@platform/constants/release';
import { dispatchGitHubWorkflow } from '@platform/server/github/dispatch-github-workflow';

export const dispatchContrastWorkflow = (): Promise<boolean> =>
  dispatchGitHubWorkflow({
    workflowFile: CONTRAST_WORKFLOW_FILE,
    inputs: {},
    logEvents: {
      skipped: RELEASE_LOG.CONTRAST_DISPATCH_SKIPPED,
      failed: RELEASE_LOG.CONTRAST_DISPATCH_FAILED,
      error: RELEASE_LOG.CONTRAST_DISPATCH_ERROR,
    },
    logContext: {},
  });
