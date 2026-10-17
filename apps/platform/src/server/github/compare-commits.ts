import { z } from 'zod';

import { fetchGitHubJson, type TGitHubResult } from './fetch-github';

// GitHub lists at most 300 changed files for a whole comparison.
const COMPARE_FILE_LIMIT = 300;

const compareSchema = z.object({
  total_commits: z.number(),
  commits: z.array(
    z.object({
      sha: z.string(),
      commit: z.object({
        message: z.string(),
        author: z.object({ name: z.string(), date: z.string() }).nullable(),
      }),
    }),
  ),
  files: z
    .array(z.object({ filename: z.string(), status: z.string() }))
    .default([]),
});

export type TComparedCommit = {
  sha: string;
  message: string;
  authorName?: string;
  authoredAt?: string;
};

export type TChangedFile = {
  filename: string;
  status: string;
};

export type TCommitComparison = {
  commits: TComparedCommit[];
  totalCommits: number;
  files: TChangedFile[];
  isFileListTruncated: boolean;
};

/** Commits run newest first. */
export const compareCommits = (
  base: string,
  head: string,
): Promise<TGitHubResult<TCommitComparison>> =>
  fetchGitHubJson(
    `/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}?per_page=100`,
    (body) => {
      const { total_commits, commits, files } = compareSchema.parse(body);

      return {
        commits: commits
          .map(({ sha, commit: { message, author } }) => ({
            sha,
            message,
            authorName: author?.name,
            authoredAt: author?.date,
          }))
          .reverse(),
        totalCommits: total_commits,
        files,
        isFileListTruncated: files.length >= COMPARE_FILE_LIMIT,
      };
    },
  );
