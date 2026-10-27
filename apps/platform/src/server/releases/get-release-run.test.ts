import { HTTP_STATUS, type TMaybeNull } from '@blog/config';
import { faker } from '@faker-js/faker';
import { GITHUB_FAILURE } from '@platform/constants/github';
import {
  RELEASE_RUN_STATUS,
  RELEASE_WORKFLOW_FILE,
  TENANT_MIGRATION_JOB_NAME,
} from '@platform/constants/release';
import {
  GITHUB_RUN_CONCLUSION,
  GITHUB_RUN_STATUS,
} from '@platform/testing/github/fixtures';
import {
  mockGitHubResponse,
  useGitHubFetch,
} from '@platform/testing/github/github-fetch';
import { mockReleaseRun } from '@platform/testing/releases/fixtures';

import { getReleaseRun } from './get-release-run';

faker.seed(5998);

vi.mock('@platform/utils/env/env');

const MOCK_RUN_ID = faker.number.int();
const MOCK_RUN = mockReleaseRun();
const MOCK_GATE_JOB_NAME = faker.lorem.words(2);
const RUNS_PATH = `/actions/workflows/${RELEASE_WORKFLOW_FILE}/runs`;
const JOBS_PATH = `/actions/runs/${MOCK_RUN_ID}/jobs`;

const workflowRun = (
  status: string,
  conclusion: TMaybeNull<string> = null,
) => ({
  id: MOCK_RUN_ID,
  status,
  conclusion,
  html_url: MOCK_RUN.url,
  display_title: MOCK_RUN.title,
  created_at: MOCK_RUN.createdAt,
});

describe(getReleaseRun, () => {
  const github = useGitHubFetch();

  const respondWithRun = (
    status: string,
    conclusion: TMaybeNull<string> = null,
  ) =>
    github.respond(RUNS_PATH, () =>
      mockGitHubResponse({ workflow_runs: [workflowRun(status, conclusion)] }),
    );

  it('is undefined when the release workflow has never run', async () => {
    github.respond(RUNS_PATH, () => mockGitHubResponse({ workflow_runs: [] }));

    expect(await getReleaseRun()).toEqual({ ok: true, data: undefined });
  });

  it('is undefined when the release workflow does not exist yet', async () => {
    expect(await getReleaseRun()).toEqual({ ok: true, data: undefined });
  });

  it.each([
    [GITHUB_RUN_STATUS.QUEUED, null, RELEASE_RUN_STATUS.DISPATCHED],
    [GITHUB_RUN_STATUS.IN_PROGRESS, null, RELEASE_RUN_STATUS.RUNNING],
    [
      GITHUB_RUN_STATUS.COMPLETED,
      GITHUB_RUN_CONCLUSION.SUCCESS,
      RELEASE_RUN_STATUS.SUCCEEDED,
    ],
  ])(
    'reads a %s run with conclusion %s as %s',
    async (status, conclusion, expected) => {
      respondWithRun(status, conclusion);

      expect(await getReleaseRun()).toEqual({
        ok: true,
        data: mockReleaseRun({ status: expected }),
      });
    },
  );

  it('flags a tenant migration failure when that job of a failed run failed', async () => {
    respondWithRun(GITHUB_RUN_STATUS.COMPLETED, GITHUB_RUN_CONCLUSION.FAILURE);
    github.respond(JOBS_PATH, () =>
      mockGitHubResponse({
        jobs: [
          {
            name: MOCK_GATE_JOB_NAME,
            conclusion: GITHUB_RUN_CONCLUSION.SUCCESS,
          },
          {
            name: `Migrate tenants / ${TENANT_MIGRATION_JOB_NAME}`,
            conclusion: GITHUB_RUN_CONCLUSION.FAILURE,
          },
          {
            name: faker.lorem.words(2),
            conclusion: GITHUB_RUN_CONCLUSION.SKIPPED,
          },
        ],
      }),
    );

    expect(await getReleaseRun()).toEqual({
      ok: true,
      data: mockReleaseRun({
        status: RELEASE_RUN_STATUS.FAILED,
        isTenantMigrationFailed: true,
      }),
    });
  });

  it('does not blame a tenant migration when another job failed', async () => {
    respondWithRun(GITHUB_RUN_STATUS.COMPLETED, GITHUB_RUN_CONCLUSION.FAILURE);
    github.respond(JOBS_PATH, () =>
      mockGitHubResponse({
        jobs: [
          {
            name: MOCK_GATE_JOB_NAME,
            conclusion: GITHUB_RUN_CONCLUSION.FAILURE,
          },
        ],
      }),
    );

    expect(await getReleaseRun()).toEqual({
      ok: true,
      data: mockReleaseRun({
        status: RELEASE_RUN_STATUS.FAILED,
        isTenantMigrationFailed: false,
      }),
    });
  });

  it('fails the read when GitHub answers with an error', async () => {
    github.respond(RUNS_PATH, () =>
      mockGitHubResponse({}, HTTP_STATUS.INTERNAL_SERVER_ERROR),
    );

    expect(await getReleaseRun()).toEqual({
      ok: false,
      error: GITHUB_FAILURE.GITHUB_ERROR,
    });
  });
});
