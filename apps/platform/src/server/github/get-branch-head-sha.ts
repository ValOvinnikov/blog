import { z } from 'zod';

import { fetchGitHubJson, type TGitHubResult } from './fetch-github';

const branchSchema = z.object({ commit: z.object({ sha: z.string() }) });

export const getBranchHeadSha = (
  branch = 'main',
): Promise<TGitHubResult<string>> =>
  fetchGitHubJson(
    `/branches/${encodeURIComponent(branch)}`,
    (body) => branchSchema.parse(body).commit.sha,
  );
