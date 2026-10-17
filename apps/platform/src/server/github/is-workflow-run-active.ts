import { z } from 'zod';

import { fetchGitHubJson, type TGitHubResult } from './fetch-github';

const runsSchema = z.object({
  workflow_runs: z.array(z.object({ status: z.string().nullable() })),
});

/** A workflow file that does not exist yet has no active run. */
export const isWorkflowRunActive = async (
  workflowFile: string,
  headSha: string,
): Promise<TGitHubResult<boolean>> => {
  const result = await fetchGitHubJson(
    `/actions/workflows/${encodeURIComponent(workflowFile)}/runs?head_sha=${headSha}&per_page=20`,
    (body) =>
      runsSchema
        .parse(body)
        .workflow_runs.some(({ status }) => status !== 'completed'),
  );

  if (!result.ok && result.reason === 'notFound') {
    return { ok: true, data: false };
  }

  return result;
};
