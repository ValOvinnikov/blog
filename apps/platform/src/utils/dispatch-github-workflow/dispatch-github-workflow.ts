import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';
import { parseTenantProvisioningRepo } from '@platform/utils/tenant-provisioning-repo/tenant-provisioning-repo';

const WORKFLOW_REF = 'main';
const DISPATCH_TIMEOUT_MS = 5000;

type TDispatchGitHubWorkflowLogEvents = {
  skipped: string;
  failed: string;
  error: string;
};

export type TDispatchGitHubWorkflowInput = {
  workflowFile: string;
  inputs: Record<string, string | undefined>;
  logEvents: TDispatchGitHubWorkflowLogEvents;
  logContext: Record<string, unknown>;
};

/**
 * Sends a `workflow_dispatch` request to trigger a GitHub Actions workflow
 * in the tenant-provisioning repo. Never throws — a missing token/repo, a
 * non-2xx response, or a network failure is logged and reported as `false`.
 */
export const dispatchGitHubWorkflow = async ({
  workflowFile,
  inputs,
  logEvents,
  logContext,
}: TDispatchGitHubWorkflowInput): Promise<boolean> => {
  const token = env.TENANT_PROVISIONING_GITHUB_TOKEN;
  const repo = parseTenantProvisioningRepo(env.TENANT_PROVISIONING_GITHUB_REPO);

  if (!token || !repo) {
    logger.error(logEvents.skipped, logContext);
    return false;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${repo.owner}/${repo.repo}/actions/workflows/${workflowFile}/dispatches`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ref: WORKFLOW_REF, inputs }),
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
