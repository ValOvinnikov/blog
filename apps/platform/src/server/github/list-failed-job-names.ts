import { z } from 'zod';

import { fetchGitHubJson, type TGitHubResult } from './fetch-github';

const jobsSchema = z.object({
  jobs: z.array(
    z.object({ name: z.string(), conclusion: z.string().nullable() }),
  ),
});

export const listFailedJobNames = (
  runId: number,
): Promise<TGitHubResult<string[]>> =>
  fetchGitHubJson(
    `/actions/runs/${runId}/jobs?filter=latest&per_page=100`,
    (body) =>
      jobsSchema
        .parse(body)
        .jobs.filter(({ conclusion }) => conclusion === 'failure')
        .map(({ name }) => name),
  );
