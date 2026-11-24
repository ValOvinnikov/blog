'use server';

import {
  DEV_DEPLOY_WORKFLOW_FILE,
  RELEASE_LOG,
} from '@platform/constants/release';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { dispatchGitHubWorkflow } from '@platform/server/github/dispatch-github-workflow';
import { logger } from '@platform/utils/logger/logger';
import { ACTION_OUTCOME, type TActionResult } from '@shinefold/config';
import { toOutcome } from '@shinefold/utils/to-outcome';

export type TStartDevDeployResult = TActionResult<
  typeof ACTION_OUTCOME.SERVER_ERROR
>;

export const startDevDeployAction =
  async (): Promise<TStartDevDeployResult> => {
    const { userId } = await requireSuperAdmin();

    const isDispatched = await dispatchGitHubWorkflow({
      workflowFile: DEV_DEPLOY_WORKFLOW_FILE,
      inputs: {},
      logEvents: {
        skipped: RELEASE_LOG.DEV_DEPLOY_DISPATCH_SKIPPED,
        failed: RELEASE_LOG.DEV_DEPLOY_DISPATCH_FAILED,
        error: RELEASE_LOG.DEV_DEPLOY_DISPATCH_ERROR,
      },
      logContext: { actorId: userId },
    });
    if (!isDispatched) return toOutcome(ACTION_OUTCOME.SERVER_ERROR);

    logger.info(RELEASE_LOG.DEV_DEPLOY_DISPATCHED, { actorId: userId });

    return toOutcome(ACTION_OUTCOME.SUCCESS);
  };
