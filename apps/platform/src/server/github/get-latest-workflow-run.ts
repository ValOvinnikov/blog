import type { TMaybeNull, TMaybeUndefined } from '@blog/config';
import { okResult } from '@blog/utils';
import { z } from 'zod';

import { fetchGitHubJson, type TGitHubResult } from './fetch-github';

const runsSchema = z.object({
  workflow_runs: z.array(
    z.object({
      id: z.number(),
      status: z.string().nullable(),
      conclusion: z.string().nullable(),
      html_url: z.string(),
      display_title: z.string(),
      created_at: z.string(),
    }),
  ),
});

export type TWorkflowRun = {
  id: number;
  status: TMaybeNull<string>;
  conclusion: TMaybeNull<string>;
  htmlUrl: string;
  title: string;
  createdAt: string;
};

/** A workflow file that does not exist yet has no run. */
export const getLatestWorkflowRun = async (
  workflowFile: string,
): Promise<TGitHubResult<TMaybeUndefined<TWorkflowRun>>> => {
  const result = await fetchGitHubJson(
    `/actions/workflows/${encodeURIComponent(workflowFile)}/runs?per_page=1`,
    (body): TMaybeUndefined<TWorkflowRun> => {
      const [run] = runsSchema.parse(body).workflow_runs;
      if (!run) return undefined;

      const { id, status, conclusion, html_url, display_title, created_at } =
        run;
      return {
        id,
        status,
        conclusion,
        htmlUrl: html_url,
        title: display_title,
        createdAt: created_at,
      };
    },
  );

  if (!result.ok && result.error === 'notFound') {
    return okResult(undefined);
  }

  return result;
};
