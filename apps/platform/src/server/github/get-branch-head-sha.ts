import { GITHUB_MOVING_REF_REVALIDATE_SECONDS } from '@platform/constants/github';
import { z } from 'zod';

import { fetchGitHubJson, type TGitHubResult } from './fetch-github';

const branchSchema = z.object({ commit: z.object({ sha: z.string() }) });

export const getBranchHeadSha = (
  branch = 'main',
): Promise<TGitHubResult<string>> =>
  fetchGitHubJson(
    `/branches/${encodeURIComponent(branch)}`,
    (body) => branchSchema.parse(body).commit.sha,
    GITHUB_MOVING_REF_REVALIDATE_SECONDS,
  );
