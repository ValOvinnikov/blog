import type { TMaybeUndefined } from '@blog/config';
import { logger } from '@platform/utils/logger/logger';

import { readGitHubCredentials } from './read-github-credentials';

const DEFAULT_WORKFLOW_REF = 'main';
const DISPATCH_TIMEOUT_MS = 5000;

type TDispatchGitHubWorkflowLogEvents = {
  skipped: string;
  failed: string;
  error: string;
};

export type TDispatchGitHubWorkflowInput = {
  workflowFile: string;
  ref?: string;
  inputs: Record<string, TMaybeUndefined<string>>;
  logEvents: TDispatchGitHubWorkflowLogEvents;
  logContext: Record<string, unknown>;
};

/** Never throws: a missing token or repo, a non-2xx response or a network failure is logged and returns `false`. */
export const dispatchGitHubWorkflow = async ({
  workflowFile,
  ref = DEFAULT_WORKFLOW_REF,
  inputs,
  logEvents,
  logContext,
}: TDispatchGitHubWorkflowInput): Promise<boolean> => {
  const credentials = readGitHubCredentials();

  if (!credentials) {
    logger.error(logEvents.skipped, logContext);
    return false;
  }

  const { token, owner, repo } = credentials;

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ref, inputs }),
        signal: AbortSignal.timeout(DISPATCH_TIMEOUT_MS),
      },
    );

    if (!response.ok) {
      logger.error(logEvents.failed, {
        ...logContext,
        responseStatus: response.status,
      });
      return false;
    }

    return true;
  } catch (error) {
    logger.error(logEvents.error, { ...logContext, error });
    return false;
  }
};
