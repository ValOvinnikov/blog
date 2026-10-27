import { HTTP_STATUS } from '@blog/config';
import { faker } from '@faker-js/faker';
import { GITHUB_FAILURE } from '@platform/constants/github';
import { GITHUB_COMPARE_FILE_LIMIT } from '@platform/constants/release';
import {
  mockChangedFile,
  mockChangedFiles,
  mockGitHubCommit,
} from '@platform/testing/github/fixtures';
import {
  mockGitHubCompareResponse,
  mockGitHubResponse,
  useGitHubFetch,
} from '@platform/testing/github/github-fetch';

import { compareCommits } from './compare-commits';

faker.seed(5998);

vi.mock('@platform/utils/env/env');

const MOCK_BASE = faker.system.semver();
const MOCK_HEAD = faker.git.commitSha();
const COMMITS_PER_PAGE = 100;
const MANY_COMMITS = 250;
const TWO_PAGES_OF_COMMITS = 150;

describe(compareCommits, () => {
  const github = useGitHubFetch();

  const respondCompare = (
    commits: ReturnType<typeof mockGitHubCommit>[],
    files: ReturnType<typeof mockChangedFiles>,
  ) => {
    github.respond(`/compare/${MOCK_BASE}...${MOCK_HEAD}`, (path) =>
      mockGitHubCompareResponse(path, commits, files),
    );
  };

  it('lists the commits newest first with the changed files', async () => {
    const commits = [mockGitHubCommit(), mockGitHubCommit()];
    const files = [mockChangedFile(faker.system.filePath())];
    respondCompare(commits, files);

    const result = await compareCommits(MOCK_BASE, MOCK_HEAD);

    expect(result.ok && result.data.totalCommits).toBe(commits.length);
    expect(result.ok && result.data.files).toEqual(files);
    expect(result.ok && result.data.isFileListTruncated).toBe(false);
    expect(result.ok && result.data.commits.map(({ sha }) => sha)).toEqual([
      commits[1]?.sha,
      commits[0]?.sha,
    ]);
  });

  it('returns every changed file of a comparison past one page', async () => {
    const files = mockChangedFiles(TWO_PAGES_OF_COMMITS);
    respondCompare([mockGitHubCommit()], files);

    const result = await compareCommits(MOCK_BASE, MOCK_HEAD);

    expect(result.ok && result.data.files).toEqual(files);
    expect(result.ok && result.data.isFileListTruncated).toBe(false);
  });

  it('flags a file list cut off at GitHub limit as truncated', async () => {
    const files = mockChangedFiles(GITHUB_COMPARE_FILE_LIMIT + 50);
    respondCompare([mockGitHubCommit()], files);

    const result = await compareCommits(MOCK_BASE, MOCK_HEAD);

    expect(result.ok && result.data.files).toEqual(
      files.slice(0, GITHUB_COMPARE_FILE_LIMIT),
    );
    expect(result.ok && result.data.isFileListTruncated).toBe(true);
  });

  it('lists the newest commits first across more than one page', async () => {
    const commits = Array.from({ length: MANY_COMMITS }, mockGitHubCommit);
    respondCompare(commits, []);

    const result = await compareCommits(MOCK_BASE, MOCK_HEAD);

    expect(result.ok && result.data.totalCommits).toBe(MANY_COMMITS);
    expect(result.ok && result.data.commits.map(({ sha }) => sha)).toEqual(
      commits
        .slice(MANY_COMMITS - COMMITS_PER_PAGE)
        .reverse()
        .map(({ sha }) => sha),
    );
  });

  it('fails with GITHUB_ERROR when a later page errors', async () => {
    const commits = Array.from(
      { length: TWO_PAGES_OF_COMMITS },
      mockGitHubCommit,
    );
    respondCompare(commits, []);
    github.respond(
      `/compare/${MOCK_BASE}...${MOCK_HEAD}?per_page=${COMMITS_PER_PAGE}&page=2`,
      () => mockGitHubResponse({}, HTTP_STATUS.INTERNAL_SERVER_ERROR),
    );

    expect(await compareCommits(MOCK_BASE, MOCK_HEAD)).toEqual({
      ok: false,
      error: GITHUB_FAILURE.GITHUB_ERROR,
    });
  });
});
