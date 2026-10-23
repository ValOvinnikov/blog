import { faker } from '@faker-js/faker';
import {
  mockGitHubResponse,
  useGitHubFetch,
} from '@platform/testing/github/github-fetch';

import { isWorkflowRunActive } from './is-workflow-run-active';

vi.mock('@platform/utils/env/env');

describe(isWorkflowRunActive, () => {
  const github = useGitHubFetch();
  const workflowFile = `${faker.lorem.slug()}.yml`;
  const headSha = faker.git.commitSha();
  const runsPath = `/actions/workflows/${workflowFile}/runs`;

  it('is active while a run for the SHA has not completed', async () => {
    github.respond(runsPath, () =>
      mockGitHubResponse({
        workflow_runs: [{ status: 'completed' }, { status: 'in_progress' }],
      }),
    );

    expect(await isWorkflowRunActive(workflowFile, headSha)).toEqual({
      ok: true,
      data: true,
    });
  });

  it('is not active when every run for the SHA has completed', async () => {
    github.respond(runsPath, () =>
      mockGitHubResponse({ workflow_runs: [{ status: 'completed' }] }),
    );

    expect(await isWorkflowRunActive(workflowFile, headSha)).toEqual({
      ok: true,
      data: false,
    });
  });

  it('is not active when the workflow does not exist', async () => {
    expect(await isWorkflowRunActive(workflowFile, headSha)).toEqual({
      ok: true,
      data: false,
    });
  });
});
