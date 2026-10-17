import { z } from 'zod';

import { fetchGitHubJson, type TGitHubResult } from './fetch-github';

const PER_PAGE = 100;
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

const FILE_PAGES = Array.from(
  { length: COMPARE_FILE_LIMIT / PER_PAGE },
  (_, index) => index + 1,
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

/** Holds at most the newest 100 commits, newest first; `totalCommits` counts every one. */
export const compareCommits = async (
  base: string,
  head: string,
): Promise<TGitHubResult<TCommitComparison>> => {
  const first = await fetchComparePage(base, head, 1);
  if (!first.ok) return first;

  const { total_commits, files: firstFiles } = first.data;
  const lastCommitPage = Math.max(1, Math.ceil(total_commits / PER_PAGE));
  const filePages = firstFiles.length === PER_PAGE ? FILE_PAGES : [1];
  const laterPages = [
    ...new Set([...filePages, lastCommitPage - 1, lastCommitPage]),
  ].filter((page) => page > 1);

  const fetched = await Promise.all(
    laterPages.map(async (page) => ({
      page,
      result: await fetchComparePage(base, head, page),
    })),
  );
  const pages = new Map([[1, first.data]]);
  for (const { page, result } of fetched) {
    if (!result.ok) return result;
    pages.set(page, result.data);
  }

  const files = filePages.flatMap((page) => pages.get(page)?.files ?? []);
  const newestCommits = [lastCommitPage - 1, lastCommitPage]
    .flatMap((page) => pages.get(page)?.commits ?? [])
    .slice(-PER_PAGE)
    .reverse();

  return {
    ok: true,
    data: {
      commits: newestCommits.map(toComparedCommit),
      totalCommits: total_commits,
      files,
      isFileListTruncated: files.length >= COMPARE_FILE_LIMIT,
    },
  };
};
