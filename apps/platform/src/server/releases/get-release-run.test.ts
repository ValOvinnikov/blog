import type { TMaybeNull } from '@blog/config';
import { GITHUB_FAILURE } from '@platform/constants/github';
import { RELEASE_RUN_STATUS } from '@platform/constants/release';
import {
  mockGitHubResponse,
  useGitHubFetch,
} from '@platform/testing/github/github-fetch';

import { getReleaseRun } from './get-release-run';

vi.mock('@platform/utils/env/env');

const runsPath = '/actions/workflows/release.yml/runs';
const jobsPath = '/actions/runs/42/jobs';
const RUN_URL = 'https://github.com/acme/blog/actions/runs/42';
const RUN_TITLE = 'Release v1.5.0';
const RUN_CREATED_AT = '2026-10-18T09:00:00Z';
const GATE_JOB_NAME = 'Gate / Full gate';

const workflowRun = (
  status: string,
  conclusion: TMaybeNull<string> = null,
) => ({
  id: 42,
  status,
  conclusion,
  html_url: RUN_URL,
  display_title: RUN_TITLE,
  created_at: RUN_CREATED_AT,
});

describe(getReleaseRun, () => {
  const github = useGitHubFetch();

  const respondWithRun = (
    status: string,
    conclusion: TMaybeNull<string> = null,
  ) =>
    github.respond(runsPath, () =>
      mockGitHubResponse({ workflow_runs: [workflowRun(status, conclusion)] }),
    );

  it('is undefined when the release workflow has never run', async () => {
    github.respond(runsPath, () => mockGitHubResponse({ workflow_runs: [] }));

    expect(await getReleaseRun()).toEqual({ ok: true, data: undefined });
  });

  it('is undefined when the release workflow does not exist yet', async () => {
    expect(await getReleaseRun()).toEqual({ ok: true, data: undefined });
  });

  it.each([
    ['queued', null, RELEASE_RUN_STATUS.DISPATCHED],
    ['in_progress', null, RELEASE_RUN_STATUS.RUNNING],
    ['completed', 'success', RELEASE_RUN_STATUS.SUCCEEDED],
  ])(
    'reads a %s run with conclusion %s as %s, with its title and link',
    async (status, conclusion, expected) => {
      respondWithRun(status, conclusion);

      expect(await getReleaseRun()).toEqual({
        ok: true,
        data: {
          status: expected,
          title: RUN_TITLE,
          url: RUN_URL,
          createdAt: RUN_CREATED_AT,
          isTenantMigrationFailed: false,
        },
      });
    },
  );

  it('says a tenant migration failed when that job of a failed run failed', async () => {
    respondWithRun('completed', 'failure');
    github.respond(jobsPath, () =>
      mockGitHubResponse({
        jobs: [
          { name: GATE_JOB_NAME, conclusion: 'success' },
          {
            name: 'Migrate tenants / Migrate tenant content',
            conclusion: 'failure',
          },
          { name: 'Deploy / Deploy prod web', conclusion: 'skipped' },
        ],
      }),
    );

    const result = await getReleaseRun();

    expect(result).toMatchObject({
      ok: true,
      data: {
        status: RELEASE_RUN_STATUS.FAILED,
        isTenantMigrationFailed: true,
      },
    });
  });

  it('does not blame a tenant migration when another job failed', async () => {
    respondWithRun('completed', 'failure');
    github.respond(jobsPath, () =>
      mockGitHubResponse({
        jobs: [{ name: GATE_JOB_NAME, conclusion: 'failure' }],
      }),
    );

    expect(await getReleaseRun()).toMatchObject({
      ok: true,
      data: {
        status: RELEASE_RUN_STATUS.FAILED,
        isTenantMigrationFailed: false,
      },
    });
  });

  it('fails the read when GitHub answers with an error', async () => {
    github.respond(runsPath, () => mockGitHubResponse({}, 500));

    expect(await getReleaseRun()).toEqual({
      ok: false,
      error: GITHUB_FAILURE.GITHUB_ERROR,
    });
  });
});
