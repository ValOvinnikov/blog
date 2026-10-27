import { faker } from '@faker-js/faker';
import { CONTRAST_WORKFLOW_FILE } from '@platform/constants/release';
import {
  MOCK_GITHUB_MAIN_BRANCH_PATH,
  MOCK_GITHUB_RELEASE_TAGS_PATH,
} from '@platform/testing/github/fixtures';
import {
  mockGitHubCompareResponse,
  mockGitHubResponse,
  type useGitHubFetch,
} from '@platform/testing/github/github-fetch';

export const MOCK_LAST_RELEASE_TAG = 'v1.4.0';

const MOCK_RENDERING_FILE = {
  filename: 'apps/web/src/app/page.tsx',
  status: 'modified',
};

export const respondWithDueContrastCheck = (
  github: ReturnType<typeof useGitHubFetch>,
): void => {
  const headSha = faker.git.commitSha();

  github.respond(MOCK_GITHUB_RELEASE_TAGS_PATH, () =>
    mockGitHubResponse([{ ref: `refs/tags/${MOCK_LAST_RELEASE_TAG}` }]),
  );
  github.respond(MOCK_GITHUB_MAIN_BRANCH_PATH, () =>
    mockGitHubResponse({ commit: { sha: headSha } }),
  );
  github.respond(`/actions/workflows/${CONTRAST_WORKFLOW_FILE}/runs`, () =>
    mockGitHubResponse({ workflow_runs: [] }),
  );
  github.respond(`/compare/${MOCK_LAST_RELEASE_TAG}...${headSha}`, (path) =>
    mockGitHubCompareResponse(path, [], [MOCK_RENDERING_FILE]),
  );
};
