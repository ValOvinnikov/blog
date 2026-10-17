import { faker } from '@faker-js/faker';
import {
  githubCompareJson,
  githubJson,
  useGitHubFetch,
} from '@platform/testing/github/github-fetch';
import { mockDbConstants } from '@platform/testing/mock-db-constants';

import { getReleaseCandidate } from './get-release-candidate';

vi.mock('@platform/utils/env/env');
vi.mock('@platform/utils/logger/logger');

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
    github.respond('/git/matching-refs/tags/v', () =>
      githubJson([{ ref: `refs/tags/${lastTag}` }]),
    );
    github.respond('/branches/main', () =>
      githubJson({ commit: { sha: headSha } }),
    );
    github.respond('/actions/workflows/contrast.yml/runs', () =>
      githubJson({ workflow_runs: [] }),
    );
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
    expect(contrastStatus).toBe('NONE');
  });

  it('reports contrast as due when a rendering path changed since the last green run', async () => {
    const lastGreenSha = faker.git.commitSha();
    const renderingFile = {
      filename: 'apps/web/src/app/page.tsx',
      status: 'modified',
    };
    getLatestPassingContrastShaMock.mockResolvedValue(lastGreenSha);
    compare(lastTag, [renderingFile]);
    compare(lastGreenSha, [renderingFile]);

    expect((await candidate()).contrastStatus).toBe('DUE');
  });

  it('reports contrast as not due when nothing rendering changed since the last green run', async () => {
    const lastGreenSha = faker.git.commitSha();
    getLatestPassingContrastShaMock.mockResolvedValue(lastGreenSha);
    compare(lastTag, [
      { filename: 'packages/ui/src/atoms/text/text.tsx', status: 'modified' },
    ]);
    compare(lastGreenSha, [{ filename: 'docs/README.md', status: 'modified' }]);

    expect((await candidate()).contrastStatus).toBe('NONE');
  });

  it('reports contrast as due when rendering changed and no run has ever passed', async () => {
    compare(lastTag, [
      { filename: 'configs/tailwind/theme.css', status: 'modified' },
    ]);

    expect((await candidate()).contrastStatus).toBe('DUE');
  });

  it('reports contrast as green when HEAD matches a stored passing run', async () => {
    compare(lastTag, [
      { filename: 'apps/web/src/app/page.tsx', status: 'modified' },
    ]);
    getContrastFindingMock.mockResolvedValue({ status: 'RESOLVED' });

    expect((await candidate()).contrastStatus).toBe('GREEN');
  });

  it('reports contrast as failed when HEAD has a failing run', async () => {
    compare(lastTag, [
      { filename: 'apps/web/src/app/page.tsx', status: 'modified' },
    ]);
    getContrastFindingMock.mockResolvedValue({ status: 'OPEN' });

    expect((await candidate()).contrastStatus).toBe('FAILED');
  });

  it('reports contrast as running while a contrast run for HEAD is in progress', async () => {
    compare(lastTag, [
      { filename: 'apps/web/src/app/page.tsx', status: 'modified' },
    ]);
    github.respond('/actions/workflows/contrast.yml/runs', () =>
      githubJson({ workflow_runs: [{ status: 'in_progress' }] }),
    );

    expect((await candidate()).contrastStatus).toBe('RUNNING');
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
    compare(lastTag, [
      { filename: 'apps/web/src/app/page.tsx', status: 'modified' },
    ]);

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
    github.respond('/git/matching-refs/tags/v', () => githubJson([]));

    expect(await getReleaseCandidate()).toEqual({
      ok: false,
      reason: 'noReleaseTag',
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
    github.respond('/branches/main', () => new Response(null, { status: 500 }));

    expect(await getReleaseCandidate()).toEqual({
      ok: false,
      reason: 'githubError',
    });
  });

  it('fails with rateLimited when GitHub rate-limits the request', async () => {
    github.respond('/branches/main', () => new Response(null, { status: 429 }));

    expect(await getReleaseCandidate()).toEqual({
      ok: false,
      reason: 'rateLimited',
    });
  });

  it('fails with dbError when a database read fails', async () => {
    compare(lastTag, [
      { filename: 'apps/web/src/app/page.tsx', status: 'modified' },
    ]);
    getContrastFindingMock.mockRejectedValue(new Error('connection lost'));

    expect(await getReleaseCandidate()).toEqual({
      ok: false,
      reason: 'dbError',
    });
  });
});
