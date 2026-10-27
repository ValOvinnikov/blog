import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { faker } from '@faker-js/faker';
import {
  GITHUB_RUN_CONCLUSION,
  GITHUB_RUN_STATUS,
} from '@platform/constants/github';
import { RELEASE_WORKFLOW_FILE } from '@platform/constants/release';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
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
import { MOCK_LAST_RELEASE_TAG } from '@platform/testing/releases/contrast-due-github';

import ReleasesPage from './page';

faker.seed(5996);

vi.mock('@platform/i18n/navigation');

vi.mock('@platform/utils/env/env');

vi.mock('@platform/server/auth/require-super-admin');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    findings: {
      getContrastFinding: vi.fn(),
      getLatestPassingContrastSha: vi.fn(),
    },
  },
}));

vi.mock('@platform/server/releases/start-contrast-check-action', () => ({
  startContrastCheckAction: vi.fn(),
}));

vi.mock('@platform/server/releases/start-release-action', () => ({
  startReleaseAction: vi.fn(),
}));

vi.mock('@platform/server/releases/get-release-run-action', () => ({
  getReleaseRunAction: vi.fn(),
}));

const MOCK_HEAD_SHA = faker.git.commitSha();
const MOCK_COMMIT_SUBJECT = faker.git.commitMessage();
const MOCK_RELEASE_RUN_TITLE = faker.lorem.words();

const setup = customRenderAsync(ReleasesPage, {});

describe(`<${ReleasesPage.name}/>`, () => {
  const github = useGitHubFetch();

  beforeEach(() => {
    github.respond(MOCK_GITHUB_RELEASE_TAGS_PATH, () =>
      mockGitHubResponse([{ ref: `refs/tags/${MOCK_LAST_RELEASE_TAG}` }]),
    );
    github.respond(MOCK_GITHUB_MAIN_BRANCH_PATH, () =>
      mockGitHubResponse({ commit: { sha: MOCK_HEAD_SHA } }),
    );
    github.respond(
      `/compare/${MOCK_LAST_RELEASE_TAG}...${MOCK_HEAD_SHA}`,
      (path) =>
        mockGitHubCompareResponse(
          path,
          [
            {
              sha: MOCK_HEAD_SHA,
              commit: { message: MOCK_COMMIT_SUBJECT, author: null },
            },
          ],
          [],
        ),
    );
    github.respond(`/actions/workflows/${RELEASE_WORKFLOW_FILE}/runs`, () =>
      mockGitHubResponse({
        workflow_runs: [
          {
            id: faker.number.int(),
            status: GITHUB_RUN_STATUS.COMPLETED,
            conclusion: GITHUB_RUN_CONCLUSION.SUCCESS,
            html_url: faker.internet.url(),
            display_title: MOCK_RELEASE_RUN_TITLE,
            created_at: faker.date.recent().toISOString(),
          },
        ],
      }),
    );
  });

  it('shows the release candidate and the latest release run', async () => {
    await setup();

    const commit = screen.getByText(MOCK_COMMIT_SUBJECT);
    const releaseRun = screen.getByText(MOCK_RELEASE_RUN_TITLE);

    expect(commit).toBeVisible();
    expect(releaseRun).toBeVisible();
  });

  it('reads nothing when the caller is not a super-admin', async () => {
    vi.mocked(requireSuperAdmin).mockRejectedValueOnce(
      new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND),
    );

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(github.fetchMock).not.toHaveBeenCalled();
  });
});
