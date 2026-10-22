import { FINDING_STATUS, HTTP_STATUS } from '@blog/config';
import { faker } from '@faker-js/faker';
import {
  CONTRAST_STATUS,
  CONTRAST_WORKFLOW_FILE,
} from '@platform/constants/release';
import {
  githubCompareJson,
  githubJson,
  useGitHubFetch,
} from '@platform/testing/github/github-fetch';
import { mockDbConstants } from '@platform/testing/mock-db-constants';

import { getReleaseCandidate } from './get-release-candidate';

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

type TFile = { filename: string; status: string };

const TAGS_PATH = '/git/matching-refs/tags/v';
const MAIN_BRANCH_PATH = '/branches/main';
const CONTRAST_RUNS_PATH = `/actions/workflows/${CONTRAST_WORKFLOW_FILE}/runs`;
const RENDERING_FILENAME = 'apps/web/src/app/page.tsx';

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

describe(getReleaseCandidate, () => {
  const github = useGitHubFetch();
  const lastTag = 'v1.4.0';
  let headSha: string;

  const compare = (base: string, files: TFile[], commits = [makeCommit()]) => {
    github.respond(`/compare/${base}...${headSha}`, (path) =>
      githubCompareJson(path, commits, files),
    );
  };

  const candidate = async () => {
    const result = await getReleaseCandidate();
    if (!result.ok) throw new Error(result.reason);
    return result.data;
  };

  beforeEach(() => {
    headSha = faker.git.commitSha();
    github.respond(TAGS_PATH, () =>
      githubJson([{ ref: `refs/tags/${lastTag}` }]),
    );
    github.respond(MAIN_BRANCH_PATH, () =>
      githubJson({ commit: { sha: headSha } }),
    );
    github.respond(CONTRAST_RUNS_PATH, () => githubJson({ workflow_runs: [] }));
    getContrastFindingMock.mockReset().mockResolvedValue(undefined);
    getLatestPassingContrastShaMock.mockReset().mockResolvedValue(undefined);
    listActiveTenantsMock.mockReset().mockResolvedValue([]);
    listAppliedMigrationTimestampsMock.mockReset().mockResolvedValue([]);
  });

  it('lists the commits since the last tag, newest first', async () => {
    const commits = [makeCommit(), makeCommit()];
    compare(lastTag, [], commits);

    const { commits: listed, totalCommits, headSha: sha } = await candidate();

    expect(sha).toBe(headSha);
    expect(totalCommits).toBe(2);
    expect(listed.map(({ sha: commitSha }) => commitSha)).toEqual([
      commits[1]?.sha,
      commits[0]?.sha,
    ]);
  });

  it('reports no commits when HEAD is the last tag', async () => {
    compare(lastTag, [], []);

    expect(await candidate()).toEqual(
      expect.objectContaining({ commits: [], totalCommits: 0 }),
    );
  });

  it('reports no rendering change and no contrast due for a docs-only candidate', async () => {
    compare(lastTag, [{ filename: 'docs/ROADMAP.md', status: 'modified' }]);

    const { changes, contrastStatus } = await candidate();

    expect(changes.RENDERING).toBe(false);
    expect(contrastStatus).toBe(CONTRAST_STATUS.NONE);
  });

  it('reports contrast as due when a rendering path changed since the last green run', async () => {
    const lastGreenSha = faker.git.commitSha();
    const renderingFile = {
      filename: RENDERING_FILENAME,
      status: 'modified',
    };
    getLatestPassingContrastShaMock.mockResolvedValue(lastGreenSha);
    compare(lastTag, [renderingFile]);
    compare(lastGreenSha, [renderingFile]);

    expect((await candidate()).contrastStatus).toBe(CONTRAST_STATUS.DUE);
  });

  it('reports contrast as not due when nothing rendering changed since the last green run', async () => {
    const lastGreenSha = faker.git.commitSha();
    getLatestPassingContrastShaMock.mockResolvedValue(lastGreenSha);
    compare(lastTag, [
      { filename: 'packages/ui/src/atoms/text/text.tsx', status: 'modified' },
    ]);
    compare(lastGreenSha, [{ filename: 'docs/README.md', status: 'modified' }]);

    expect((await candidate()).contrastStatus).toBe(CONTRAST_STATUS.NONE);
  });

  it('reports contrast as due when rendering changed and no run has ever passed', async () => {
    compare(lastTag, [
      { filename: 'configs/tailwind/theme.css', status: 'modified' },
    ]);

    expect((await candidate()).contrastStatus).toBe(CONTRAST_STATUS.DUE);
  });

  it('reports contrast as green when HEAD matches a stored passing run', async () => {
    compare(lastTag, [{ filename: RENDERING_FILENAME, status: 'modified' }]);
    getContrastFindingMock.mockResolvedValue({
      status: FINDING_STATUS.RESOLVED,
    });

    expect((await candidate()).contrastStatus).toBe(CONTRAST_STATUS.GREEN);
  });

  it('reports contrast as failed when HEAD has a failing run', async () => {
    compare(lastTag, [{ filename: RENDERING_FILENAME, status: 'modified' }]);
    getContrastFindingMock.mockResolvedValue({ status: FINDING_STATUS.OPEN });

    expect((await candidate()).contrastStatus).toBe(CONTRAST_STATUS.FAILED);
  });

  it('reports contrast as running while a contrast run for HEAD is in progress', async () => {
    compare(lastTag, [{ filename: RENDERING_FILENAME, status: 'modified' }]);
    github.respond(CONTRAST_RUNS_PATH, () =>
      githubJson({ workflow_runs: [{ status: 'in_progress' }] }),
    );

    expect((await candidate()).contrastStatus).toBe(CONTRAST_STATUS.RUNNING);
  });

  it('counts the content migrations, the tenants they run across and the pending db migrations', async () => {
    const appliedWhen = faker.date.past().getTime();
    const pendingWhen = faker.date.recent().getTime();
    compare(lastTag, [
      {
        filename: 'packages/studio/migrations/20261010T0900-add-thing/index.ts',
        status: 'added',
      },
      { filename: 'packages/db/migrations/0042_applied.sql', status: 'added' },
      { filename: 'packages/db/migrations/0043_pending.sql', status: 'added' },
    ]);
    const entries = [
      { tag: '0042_applied', when: appliedWhen },
      { tag: '0043_pending', when: pendingWhen },
    ];
    github.respond('/contents/packages/db/migrations/meta/_journal.json', () =>
      githubJson({
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
    compare(lastTag, [{ filename: RENDERING_FILENAME, status: 'modified' }]);

    expect((await candidate()).migrations).toEqual({
      contentMigrations: 0,
      tenants: 0,
      dbMigrations: 0,
      isLowerBound: false,
    });
    expect(listActiveTenantsMock).not.toHaveBeenCalled();
  });

  it('reports the change list as incomplete and the migration counts as minimums at the file limit', async () => {
    compare(
      lastTag,
      Array.from({ length: 300 }, (_, index) => ({
        filename: `apps/web/src/file-${index}.ts`,
        status: 'modified',
      })),
    );

    const { isFileListTruncated, migrations } = await candidate();

    expect(isFileListTruncated).toBe(true);
    expect(migrations.isLowerBound).toBe(true);
  });

  it('fails with noReleaseTag when the repository has no release tag yet', async () => {
    github.respond(TAGS_PATH, () => githubJson([]));

    expect(await getReleaseCandidate()).toEqual({
      ok: false,
      reason: 'noReleaseTag',
    });
  });

  it('fails with tagListIncomplete when the tag list never stops paging', async () => {
    github.respond(TAGS_PATH, () =>
      githubJson(
        Array.from({ length: 100 }, (_, index) => ({
          ref: `refs/tags/v1.${index}.0`,
        })),
      ),
    );

    expect(await getReleaseCandidate()).toEqual({
      ok: false,
      reason: 'tagListIncomplete',
    });
  });

  it('fails with notConfigured when the token is missing', async () => {
    github.unsetToken();

    expect(await getReleaseCandidate()).toEqual({
      ok: false,
      reason: 'notConfigured',
    });
  });

  it('fails with githubError when GitHub errors', async () => {
    github.respond(
      MAIN_BRANCH_PATH,
      () => new Response(null, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }),
    );

    expect(await getReleaseCandidate()).toEqual({
      ok: false,
      reason: 'githubError',
    });
  });

  it('fails with rateLimited when GitHub rate-limits the request', async () => {
    github.respond(MAIN_BRANCH_PATH, () => new Response(null, { status: 429 }));

    expect(await getReleaseCandidate()).toEqual({
      ok: false,
      reason: 'rateLimited',
    });
  });

  it('fails with dbError when a database read fails', async () => {
    compare(lastTag, [{ filename: RENDERING_FILENAME, status: 'modified' }]);
    getContrastFindingMock.mockRejectedValue(new Error('connection lost'));

    expect(await getReleaseCandidate()).toEqual({
      ok: false,
      reason: 'dbError',
    });
  });
});
