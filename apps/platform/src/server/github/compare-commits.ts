import { GITHUB_COMPARE_FILE_LIMIT } from '@platform/constants/release';
import { okResult } from '@shinefold/utils';
import { z } from 'zod';

import { cacheGitHubResult } from './cache-github-result';
import { fetchGitHubJson, type TGitHubResult } from './fetch-github';

const PER_PAGE = 100;

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

type TComparePage = z.infer<typeof compareSchema>;

const fetchComparePage = (
  base: string,
  head: string,
  page: number,
): Promise<TGitHubResult<TComparePage>> =>
  fetchGitHubJson(
    `/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}?per_page=${PER_PAGE}&page=${page}`,
    (body) => compareSchema.parse(body),
  );

const toComparedCommit = ({
  sha,
  commit: { message, author },
}: TComparePage['commits'][number]): TComparedCommit => ({
  sha,
  message,
  authorName: author?.name,
  authoredAt: author?.date,
});

const readComparison = async (
  base: string,
  head: string,
): Promise<TGitHubResult<TCommitComparison>> => {
  const first = await fetchComparePage(base, head, 1);
  if (!first.ok) return first;

  const { total_commits, files } = first.data;
  const lastCommitPage = Math.max(1, Math.ceil(total_commits / PER_PAGE));
  const newestPages = [lastCommitPage - 1, lastCommitPage];

  const fetched = await Promise.all(
    newestPages
      .filter((page) => page > 1)
      .map(async (page) => ({
        page,
        result: await fetchComparePage(base, head, page),
      })),
  );
  const pages = new Map([[1, first.data]]);
  for (const { page, result } of fetched) {
    if (!result.ok) return result;
    pages.set(page, result.data);
  }

  const newestCommits = newestPages
    .flatMap((page) => pages.get(page)?.commits ?? [])
    .slice(-PER_PAGE)
    .reverse();

  return okResult({
    commits: newestCommits.map(toComparedCommit),
    totalCommits: total_commits,
    files,
    isFileListTruncated: files.length >= GITHUB_COMPARE_FILE_LIMIT,
  });
};

/** Holds at most the newest 100 commits, newest first; `totalCommits` counts every one. */
export const compareCommits = cacheGitHubResult(readComparison, [
  'github-compare',
]);
