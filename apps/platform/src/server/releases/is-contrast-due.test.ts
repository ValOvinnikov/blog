import { faker } from '@faker-js/faker';
import {
  githubCompareJson,
  githubJson,
  useGitHubFetch,
} from '@platform/testing/github/github-fetch';
import { mockDbConstants } from '@platform/testing/mock-db-constants';

import { isContrastDue } from './is-contrast-due';

vi.mock('@platform/utils/env/env');
vi.mock('@platform/utils/logger/logger');

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
      githubCompareJson(path, [], files),
    );
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
  });

  it('is due when a rendering path changed and no run has passed', async () => {
    compare([renderingFile]);

    expect(await isContrastDue()).toBe(true);
  });

  it('is not due when HEAD already has a passing run', async () => {
    compare([renderingFile]);
    getContrastFindingMock.mockResolvedValue({ status: 'RESOLVED' });

    expect(await isContrastDue()).toBe(false);
  });

  it('is not due when nothing rendering changed', async () => {
    compare([{ filename: 'docs/ROADMAP.md', status: 'modified' }]);

    expect(await isContrastDue()).toBe(false);
  });

  it('is not due when GitHub cannot be reached', async () => {
    github.respond('/branches/main', () => githubJson({}, 500));

    expect(await isContrastDue()).toBe(false);
  });

  it('is not due when the GitHub token is unset', async () => {
    github.unsetToken();

    expect(await isContrastDue()).toBe(false);
  });

  it('is not due when the findings read fails', async () => {
    compare([renderingFile]);
    getContrastFindingMock.mockRejectedValue(new Error('db down'));

    expect(await isContrastDue()).toBe(false);
  });
});
