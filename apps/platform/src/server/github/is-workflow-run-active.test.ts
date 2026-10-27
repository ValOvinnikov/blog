import { faker } from '@faker-js/faker';
import { GITHUB_RUN_STATUS } from '@platform/testing/github/fixtures';
import {
  mockGitHubResponse,
  useGitHubFetch,
} from '@platform/testing/github/github-fetch';

import { isWorkflowRunActive } from './is-workflow-run-active';

faker.seed(5998);

vi.mock('@platform/utils/env/env');

const MOCK_WORKFLOW_FILE = `${faker.lorem.slug()}.yml`;
const MOCK_HEAD_SHA = faker.git.commitSha();
const RUNS_PATH = `/actions/workflows/${MOCK_WORKFLOW_FILE}/runs`;

describe(isWorkflowRunActive, () => {
  const github = useGitHubFetch();

  it('is active while a run for the SHA has not completed', async () => {
    github.respond(RUNS_PATH, () =>
      mockGitHubResponse({
        workflow_runs: [
          { status: GITHUB_RUN_STATUS.COMPLETED },
          { status: GITHUB_RUN_STATUS.IN_PROGRESS },
        ],
      }),
    );

    expect(
      await isWorkflowRunActive(MOCK_WORKFLOW_FILE, MOCK_HEAD_SHA),
    ).toEqual({
      ok: true,
      data: true,
    });
  });

  it('is not active when every run for the SHA has completed', async () => {
    github.respond(RUNS_PATH, () =>
      mockGitHubResponse({
        workflow_runs: [{ status: GITHUB_RUN_STATUS.COMPLETED }],
      }),
    );

    expect(
      await isWorkflowRunActive(MOCK_WORKFLOW_FILE, MOCK_HEAD_SHA),
    ).toEqual({
      ok: true,
      data: false,
    });
  });

  it('is not active when the workflow does not exist', async () => {
    expect(
      await isWorkflowRunActive(MOCK_WORKFLOW_FILE, MOCK_HEAD_SHA),
    ).toEqual({
      ok: true,
      data: false,
    });
  });
});
