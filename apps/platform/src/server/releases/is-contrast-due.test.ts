import { FINDING_STATUS, HTTP_STATUS } from '@blog/config';
import { faker } from '@faker-js/faker';
import {
  MOCK_GITHUB_CONTRAST_RUNS_PATH,
  MOCK_GITHUB_MAIN_BRANCH_PATH,
  MOCK_GITHUB_RELEASE_TAGS_PATH,
  mockChangedFile,
} from '@platform/testing/github/fixtures';
import {
  mockGitHubCompareResponse,
  mockGitHubResponse,
  useGitHubFetch,
} from '@platform/testing/github/github-fetch';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { MOCK_RELEASE_LAST_TAG } from '@platform/testing/releases/fixtures';

import { isContrastDue } from './is-contrast-due';

faker.seed(5998);

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

const MOCK_RENDERING_FILE = mockChangedFile('apps/web/src/app/page.tsx');
const MOCK_DOCS_FILE = mockChangedFile('docs/ROADMAP.md');

describe(isContrastDue, () => {
  const github = useGitHubFetch();
  let headSha: string;

  const compare = (files: ReturnType<typeof mockChangedFile>[]) => {
    github.respond(`/compare/${MOCK_RELEASE_LAST_TAG}...${headSha}`, (path) =>
      mockGitHubCompareResponse(path, [], files),
    );
  };

  beforeEach(() => {
    headSha = faker.git.commitSha();
    github.respond(MOCK_GITHUB_RELEASE_TAGS_PATH, () =>
      mockGitHubResponse([{ ref: `refs/tags/${MOCK_RELEASE_LAST_TAG}` }]),
    );
    github.respond(MOCK_GITHUB_MAIN_BRANCH_PATH, () =>
      mockGitHubResponse({ commit: { sha: headSha } }),
    );
    github.respond(MOCK_GITHUB_CONTRAST_RUNS_PATH, () =>
      mockGitHubResponse({ workflow_runs: [] }),
    );
    getContrastFindingMock.mockReset().mockResolvedValue(undefined);
    getLatestPassingContrastShaMock.mockReset().mockResolvedValue(undefined);
  });

  describe('when a rendering path changed', () => {
    beforeEach(() => {
      compare([MOCK_RENDERING_FILE]);
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
      getContrastFindingMock.mockRejectedValue(
        new Error(faker.lorem.sentence()),
      );

      expect(await isContrastDue()).toBe(false);
    });
  });

  it('is not due when nothing rendering changed', async () => {
    compare([MOCK_DOCS_FILE]);

    expect(await isContrastDue()).toBe(false);
  });

  it('is not due when GitHub cannot be reached', async () => {
    github.respond(MOCK_GITHUB_MAIN_BRANCH_PATH, () =>
      mockGitHubResponse({}, HTTP_STATUS.INTERNAL_SERVER_ERROR),
    );

    expect(await isContrastDue()).toBe(false);
  });

  it('is not due when the GitHub token is unset', async () => {
    github.unsetToken();

    expect(await isContrastDue()).toBe(false);
  });
});
