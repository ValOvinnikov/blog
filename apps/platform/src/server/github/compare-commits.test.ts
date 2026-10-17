import { faker } from '@faker-js/faker';
import {
  githubJson,
  useGitHubFetch,
} from '@platform/testing/github/github-fetch';

import { compareCommits } from './compare-commits';

vi.mock('@platform/utils/env/env');
vi.mock('@platform/utils/logger/logger');

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

describe(compareCommits, () => {
  const github = useGitHubFetch();
  const base = 'v1.0.0';
  const head = faker.git.commitSha();

  it('lists the commits newest first with the changed files', async () => {
    const commits = [makeCommit(), makeCommit()];
    const files = [{ filename: 'apps/web/src/page.tsx', status: 'modified' }];
    github.respond(`/compare/${base}...${head}`, () =>
      githubJson({ total_commits: 2, commits, files }),
    );

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

  it('reports a file list GitHub cut off at its limit as truncated', async () => {
    const files = Array.from({ length: 300 }, () => ({
      filename: faker.system.filePath(),
      status: 'modified',
    }));
    github.respond(`/compare/${base}...${head}`, () =>
      githubJson({ total_commits: 1, commits: [makeCommit()], files }),
    );

    expect(await compareCommits(base, head)).toEqual({
      ok: true,
      data: expect.objectContaining({ isFileListTruncated: true }),
    });
  });
});
