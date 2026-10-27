import { FINDING_STATUS, HTTP_STATUS, RELEASE_CHANGE } from '@blog/config';
import { faker } from '@faker-js/faker';
import { GITHUB_FAILURE } from '@platform/constants/github';
import {
  CONTRAST_STATUS,
  GITHUB_COMPARE_FILE_LIMIT,
  RELEASE_FAILURE,
} from '@platform/constants/release';
import {
  GITHUB_FILE_STATUS,
  GITHUB_RUN_STATUS,
  MOCK_GITHUB_CONTRAST_RUNS_PATH,
  MOCK_GITHUB_DB_JOURNAL_PATH,
  MOCK_GITHUB_MAIN_BRANCH_PATH,
  MOCK_GITHUB_RELEASE_TAGS_PATH,
  mockChangedFile,
  mockChangedFiles,
  mockGitHubCommit,
} from '@platform/testing/github/fixtures';
import {
  mockGitHubCompareResponse,
  mockGitHubResponse,
  useGitHubFetch,
} from '@platform/testing/github/github-fetch';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { MOCK_RELEASE_LAST_TAG } from '@platform/testing/releases/fixtures';

import { getReleaseCandidate } from './get-release-candidate';

faker.seed(5998);

vi.mock('@platform/utils/env/env');

const {
  getContrastFindingMock,
  getLatestPassingContrastShaMock,
  listActiveTenantsMock,
  listAppliedMigrationTimestampsMock,
} = vi.hoisted(() => ({
  getContrastFindingMock: vi.fn(),
  getLatestPassingContrastShaMock: vi.fn(),
  listActiveTenantsMock: vi.fn(),
  listAppliedMigrationTimestampsMock: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    findings: {
      getContrastFinding: getContrastFindingMock,
      getLatestPassingContrastSha: getLatestPassingContrastShaMock,
    },
    tenants: { listActiveTenants: listActiveTenantsMock },
    migrations: {
      listAppliedMigrationTimestamps: listAppliedMigrationTimestampsMock,
    },
  },
}));

const TAG_PAGE_SIZE = 100;
const MOCK_RENDERING_FILE = mockChangedFile('apps/web/src/app/page.tsx');
const MOCK_DOCS_FILE = mockChangedFile('docs/ROADMAP.md');

describe(getReleaseCandidate, () => {
  const github = useGitHubFetch();
  let headSha: string;

  const compare = (
    base: string,
    files: ReturnType<typeof mockChangedFiles>,
    commits = [mockGitHubCommit()],
  ) => {
    github.respond(`/compare/${base}...${headSha}`, (path) =>
      mockGitHubCompareResponse(path, commits, files),
    );
  };

  const candidate = async () => {
    const result = await getReleaseCandidate();
    if (!result.ok) throw new Error(result.error);
    return result.data;
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
    listActiveTenantsMock.mockReset().mockResolvedValue([]);
    listAppliedMigrationTimestampsMock.mockReset().mockResolvedValue([]);
  });

  it('lists the commits since the last tag, newest first', async () => {
    const commits = [mockGitHubCommit(), mockGitHubCommit()];
    compare(MOCK_RELEASE_LAST_TAG, [], commits);

    const { commits: listed, totalCommits, headSha: sha } = await candidate();

    expect(sha).toBe(headSha);
    expect(totalCommits).toBe(commits.length);
    expect(listed.map(({ sha: commitSha }) => commitSha)).toEqual([
      commits[1]?.sha,
      commits[0]?.sha,
    ]);
  });

  it('reports no commits when HEAD is the last tag', async () => {
    compare(MOCK_RELEASE_LAST_TAG, [], []);

    const { commits, totalCommits } = await candidate();

    expect(commits).toEqual([]);
    expect(totalCommits).toBe(0);
  });

  it('reports no rendering change and no contrast due for a docs-only candidate', async () => {
    compare(MOCK_RELEASE_LAST_TAG, [MOCK_DOCS_FILE]);

    const { changes, contrastStatus } = await candidate();

    expect(changes[RELEASE_CHANGE.RENDERING]).toBe(false);
    expect(contrastStatus).toBe(CONTRAST_STATUS.NONE);
  });

  it('reports contrast as due when rendering changed since the last green run', async () => {
    const lastGreenSha = faker.git.commitSha();
    getLatestPassingContrastShaMock.mockResolvedValue(lastGreenSha);
    compare(MOCK_RELEASE_LAST_TAG, [MOCK_RENDERING_FILE]);
    compare(lastGreenSha, [MOCK_RENDERING_FILE]);

    expect((await candidate()).contrastStatus).toBe(CONTRAST_STATUS.DUE);
  });

  it('reports contrast as not due when nothing rendering changed since a green run', async () => {
    const lastGreenSha = faker.git.commitSha();
    getLatestPassingContrastShaMock.mockResolvedValue(lastGreenSha);
    compare(MOCK_RELEASE_LAST_TAG, [MOCK_RENDERING_FILE]);
    compare(lastGreenSha, [MOCK_DOCS_FILE]);

    expect((await candidate()).contrastStatus).toBe(CONTRAST_STATUS.NONE);
  });

  it('reports contrast as due when rendering changed and no run has ever passed', async () => {
    compare(MOCK_RELEASE_LAST_TAG, [MOCK_RENDERING_FILE]);

    expect((await candidate()).contrastStatus).toBe(CONTRAST_STATUS.DUE);
  });

  it.each([
    [FINDING_STATUS.RESOLVED, CONTRAST_STATUS.GREEN],
    [FINDING_STATUS.OPEN, CONTRAST_STATUS.FAILED],
  ])(
    'reports a HEAD contrast finding that is %s as %s',
    async (findingStatus, expected) => {
      compare(MOCK_RELEASE_LAST_TAG, [MOCK_RENDERING_FILE]);
      getContrastFindingMock.mockResolvedValue({ status: findingStatus });

      expect((await candidate()).contrastStatus).toBe(expected);
    },
  );

  it('reports contrast as running while a contrast run for HEAD is in progress', async () => {
    compare(MOCK_RELEASE_LAST_TAG, [MOCK_RENDERING_FILE]);
    github.respond(MOCK_GITHUB_CONTRAST_RUNS_PATH, () =>
      mockGitHubResponse({
        workflow_runs: [{ status: GITHUB_RUN_STATUS.IN_PROGRESS }],
      }),
    );

    expect((await candidate()).contrastStatus).toBe(CONTRAST_STATUS.RUNNING);
  });

  it('counts content migrations, their tenants and pending db migrations', async () => {
    const appliedWhen = faker.number.int();
    const pendingWhen = faker.number.int();
    compare(MOCK_RELEASE_LAST_TAG, [
      mockChangedFile(
        'packages/studio/migrations/20261010T0900-add-thing/index.ts',
        GITHUB_FILE_STATUS.ADDED,
      ),
      mockChangedFile(
        'packages/db/migrations/0042_applied.sql',
        GITHUB_FILE_STATUS.ADDED,
      ),
      mockChangedFile(
        'packages/db/migrations/0043_pending.sql',
        GITHUB_FILE_STATUS.ADDED,
      ),
    ]);
    const entries = [
      { tag: '0042_applied', when: appliedWhen },
      { tag: '0043_pending', when: pendingWhen },
    ];
    github.respond(MOCK_GITHUB_DB_JOURNAL_PATH, () =>
      mockGitHubResponse({
        content: Buffer.from(JSON.stringify({ entries })).toString('base64'),
      }),
    );
    listActiveTenantsMock.mockResolvedValue([{}, {}]);
    listAppliedMigrationTimestampsMock.mockResolvedValue([appliedWhen]);

    expect((await candidate()).migrations).toEqual({
      contentMigrations: 1,
      tenants: 3,
      dbMigrations: 1,
      isLowerBound: false,
    });
  });

  it('reports zero migrations when the release adds none', async () => {
    compare(MOCK_RELEASE_LAST_TAG, [MOCK_RENDERING_FILE]);

    expect((await candidate()).migrations).toEqual({
      contentMigrations: 0,
      tenants: 0,
      dbMigrations: 0,
      isLowerBound: false,
    });
    expect(listActiveTenantsMock).not.toHaveBeenCalled();
  });

  it('treats migration counts as minimums when the file list is truncated', async () => {
    compare(MOCK_RELEASE_LAST_TAG, mockChangedFiles(GITHUB_COMPARE_FILE_LIMIT));

    const { isFileListTruncated, migrations } = await candidate();

    expect(isFileListTruncated).toBe(true);
    expect(migrations.isLowerBound).toBe(true);
  });

  it('fails with NO_RELEASE_TAG when the repository has no release tag yet', async () => {
    github.respond(MOCK_GITHUB_RELEASE_TAGS_PATH, () => mockGitHubResponse([]));

    expect(await getReleaseCandidate()).toEqual({
      ok: false,
      error: RELEASE_FAILURE.NO_RELEASE_TAG,
    });
  });

  it('fails with TAG_LIST_INCOMPLETE when the tag list never stops paging', async () => {
    github.respond(MOCK_GITHUB_RELEASE_TAGS_PATH, () =>
      mockGitHubResponse(
        Array.from({ length: TAG_PAGE_SIZE }, (_, index) => ({
          ref: `refs/tags/v1.${index}.0`,
        })),
      ),
    );

    expect(await getReleaseCandidate()).toEqual({
      ok: false,
      error: RELEASE_FAILURE.TAG_LIST_INCOMPLETE,
    });
  });

  it('fails with NOT_CONFIGURED when the token is missing', async () => {
    github.unsetToken();

    expect(await getReleaseCandidate()).toEqual({
      ok: false,
      error: GITHUB_FAILURE.NOT_CONFIGURED,
    });
  });

  it.each([
    [HTTP_STATUS.INTERNAL_SERVER_ERROR, GITHUB_FAILURE.GITHUB_ERROR],
    [HTTP_STATUS.TOO_MANY_REQUESTS, GITHUB_FAILURE.RATE_LIMITED],
  ])('fails when GitHub answers %s with %s', async (status, error) => {
    github.respond(
      MOCK_GITHUB_MAIN_BRANCH_PATH,
      () => new Response(null, { status }),
    );

    expect(await getReleaseCandidate()).toEqual({ ok: false, error });
  });

  it('fails with DB_ERROR when a database read fails', async () => {
    compare(MOCK_RELEASE_LAST_TAG, [MOCK_RENDERING_FILE]);
    getContrastFindingMock.mockRejectedValue(new Error(faker.lorem.sentence()));

    expect(await getReleaseCandidate()).toEqual({
      ok: false,
      error: RELEASE_FAILURE.DB_ERROR,
    });
  });
});
