import { FINDING_STATUS } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import { CONTRAST_WORKFLOW_FILE } from '@platform/constants/release';
import {
  MOCK_GITHUB_MAIN_BRANCH_PATH,
  MOCK_GITHUB_RELEASE_TAGS_PATH,
} from '@platform/testing/github/fixtures';
import {
  mockGitHubCompareResponse,
  mockGitHubResponse,
  useGitHubFetch,
} from '@platform/testing/github/github-fetch';
import { mockDbConstants } from '@platform/testing/mock-db-constants';

import { isContrastDue } from './is-contrast-due';

vi.mock('@platform/utils/env/env');

const { getContrastFindingMock, getLatestPassingContrastShaMock } = vi.hoisted(
  () => ({
    getContrastFindingMock: vi.fn(),
    getLatestPassingContrastShaMock: vi.fn(),
  }),
);

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    findings: {
      getContrastFinding: getContrastFindingMock,
      getLatestPassingContrastSha: getLatestPassingContrastShaMock,
    },
  },
}));

const renderingFile = {
  filename: 'apps/web/src/app/page.tsx',
  status: 'modified',
};

describe(isContrastDue, () => {
  const github = useGitHubFetch();
  const lastTag = 'v1.4.0';
  let headSha: string;

  const compare = (files: unknown[]) => {
    github.respond(`/compare/${lastTag}...${headSha}`, (path) =>
      mockGitHubCompareResponse(path, [], files),
    );
  };

  beforeEach(() => {
    headSha = faker.git.commitSha();
    github.respond(MOCK_GITHUB_RELEASE_TAGS_PATH, () =>
      mockGitHubResponse([{ ref: `refs/tags/${lastTag}` }]),
    );
    github.respond(MOCK_GITHUB_MAIN_BRANCH_PATH, () =>
      mockGitHubResponse({ commit: { sha: headSha } }),
    );
    github.respond(`/actions/workflows/${CONTRAST_WORKFLOW_FILE}/runs`, () =>
      mockGitHubResponse({ workflow_runs: [] }),
    );
    getContrastFindingMock.mockReset().mockResolvedValue(undefined);
    getLatestPassingContrastShaMock.mockReset().mockResolvedValue(undefined);
  });

  describe('when a rendering path changed', () => {
    beforeEach(() => {
      compare([renderingFile]);
    });

    it('is due when no run has passed', async () => {
      expect(await isContrastDue()).toBe(true);
    });

    it('is not due when HEAD already has a passing run', async () => {
      getContrastFindingMock.mockResolvedValue({
        status: FINDING_STATUS.RESOLVED,
      });

      expect(await isContrastDue()).toBe(false);
    });

    it('is not due when the findings read fails', async () => {
      getContrastFindingMock.mockRejectedValue(new Error('db down'));

      expect(await isContrastDue()).toBe(false);
    });
  });

  it('is not due when nothing rendering changed', async () => {
    compare([{ filename: 'docs/ROADMAP.md', status: 'modified' }]);

    expect(await isContrastDue()).toBe(false);
  });

  it('is not due when GitHub cannot be reached', async () => {
    github.respond(MOCK_GITHUB_MAIN_BRANCH_PATH, () =>
      mockGitHubResponse({}, 500),
    );

    expect(await isContrastDue()).toBe(false);
  });

  it('is not due when the GitHub token is unset', async () => {
    github.unsetToken();

    expect(await isContrastDue()).toBe(false);
  });
});
