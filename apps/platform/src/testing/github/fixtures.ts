import type { TValueOf } from '@blog/config/utils';
import { faker } from '@faker-js/faker';
import { GITHUB_FILE_STATUS } from '@platform/constants/github';
import { CONTRAST_WORKFLOW_FILE } from '@platform/constants/release';
import type { TChangedFile } from '@platform/server/github/compare-commits';

export const MOCK_GITHUB_RELEASE_TAGS_PATH = '/git/matching-refs/tags/v';
export const MOCK_GITHUB_MAIN_BRANCH_PATH = '/branches/main';
export const MOCK_GITHUB_DB_JOURNAL_PATH =
  '/contents/packages/db/migrations/meta/_journal.json';
export const MOCK_GITHUB_CONTRAST_RUNS_PATH = `/actions/workflows/${CONTRAST_WORKFLOW_FILE}/runs`;

export const mockGitHubCommit = () => ({
  sha: faker.git.commitSha(),
  commit: {
    message: faker.git.commitMessage(),
    author: {
      name: faker.person.fullName(),
      date: faker.date.past().toISOString(),
    },
  },
});

export const mockChangedFile = (
  filename: string,
  status: TValueOf<typeof GITHUB_FILE_STATUS> = GITHUB_FILE_STATUS.MODIFIED,
): TChangedFile => ({ filename, status });

export const mockChangedFiles = (count: number): TChangedFile[] =>
  Array.from({ length: count }, (_, index) =>
    mockChangedFile(`apps/web/src/file-${index}.ts`),
  );
