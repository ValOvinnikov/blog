import { faker } from '@faker-js/faker';
import {
  githubCompareJson,
  githubJson,
  useGitHubFetch,
} from '@platform/testing/github/github-fetch';

import { compareCommits } from './compare-commits';

vi.mock('@platform/utils/env/env');

const makeCommit = () => ({
  sha: faker.git.commitSha(),
  commit: {
    message: faker.git.commitMessage(),
    author: {
      name: faker.person.fullName(),
      date: faker.date.past().toISOString(),
    },
  },
});

const makeFiles = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    filename: `apps/web/src/file-${index}.ts`,
    status: 'modified',
  }));

describe(compareCommits, () => {
  const github = useGitHubFetch();
  const base = 'v1.0.0';
  const head = faker.git.commitSha();

  const respondCompare = (
    commits: ReturnType<typeof makeCommit>[],
    files: ReturnType<typeof makeFiles>,
  ) => {
    github.respond(`/compare/${base}...${head}`, (path) =>
      githubCompareJson(path, commits, files),
    );
  };

  it('lists the commits newest first with the changed files', async () => {
    const commits = [makeCommit(), makeCommit()];
    const files = [{ filename: 'apps/web/src/page.tsx', status: 'modified' }];
    respondCompare(commits, files);

    const result = await compareCommits(base, head);

    expect(result).toEqual({
      ok: true,
      data: expect.objectContaining({
        totalCommits: 2,
        files,
        isFileListTruncated: false,
      }),
    });
    expect(result.ok && result.data.commits.map(({ sha }) => sha)).toEqual([
      commits[1]?.sha,
      commits[0]?.sha,
    ]);
  });

  it('returns every changed file of a comparison past one page', async () => {
    const files = makeFiles(150);
    respondCompare([makeCommit()], files);

    expect(await compareCommits(base, head)).toEqual({
      ok: true,
      data: expect.objectContaining({ files, isFileListTruncated: false }),
    });
  });

  it('reports a file list GitHub cut off at its limit as truncated', async () => {
    const files = makeFiles(350);
    respondCompare([makeCommit()], files);

    expect(await compareCommits(base, head)).toEqual({
      ok: true,
      data: expect.objectContaining({
        files: files.slice(0, 300),
        isFileListTruncated: true,
      }),
    });
  });

  it('lists the newest commits first when there are more than one page of them', async () => {
    const commits = Array.from({ length: 250 }, makeCommit);
    respondCompare(commits, []);

    const result = await compareCommits(base, head);

    expect(result.ok && result.data.totalCommits).toBe(250);
    expect(result.ok && result.data.commits.map(({ sha }) => sha)).toEqual(
      commits
        .slice(150)
        .reverse()
        .map(({ sha }) => sha),
    );
  });

  it('fails with githubError when a later page errors', async () => {
    const commits = Array.from({ length: 150 }, makeCommit);
    respondCompare(commits, []);
    github.respond(`/compare/${base}...${head}?per_page=100&page=2`, () =>
      githubJson({}, 500),
    );

    expect(await compareCommits(base, head)).toEqual({
      ok: false,
      error: 'githubError',
    });
  });
});
