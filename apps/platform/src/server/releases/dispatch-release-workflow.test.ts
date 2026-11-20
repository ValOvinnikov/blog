import { faker } from '@faker-js/faker';
import { RELEASE_WORKFLOW_FILE } from '@platform/constants/release';
import { MOCK_RELEASE_VERSION } from '@platform/testing/releases/fixtures';

import { dispatchReleaseWorkflow } from './dispatch-release-workflow';

faker.seed(7744);

const { dispatchGitHubWorkflowMock } = vi.hoisted(() => ({
  dispatchGitHubWorkflowMock: vi.fn(),
}));

vi.mock('@platform/server/github/dispatch-github-workflow', () => ({
  dispatchGitHubWorkflow: dispatchGitHubWorkflowMock,
}));

describe(dispatchReleaseWorkflow, () => {
  beforeEach(() => {
    dispatchGitHubWorkflowMock.mockReset().mockResolvedValue(true);
  });

  it.each([true, false])(
    'sends the candidate head sha as the release sha input when override is %s',
    async (isOverride) => {
      const headSha = faker.git.commitSha();

      const isDispatched = await dispatchReleaseWorkflow({
        version: MOCK_RELEASE_VERSION,
        headSha,
        isOverride,
      });

      expect(isDispatched).toBe(true);
      expect(dispatchGitHubWorkflowMock).toHaveBeenCalledWith(
        expect.objectContaining({
          workflowFile: RELEASE_WORKFLOW_FILE,
          inputs: {
            version: MOCK_RELEASE_VERSION,
            sha: headSha,
            override: String(isOverride),
          },
        }),
      );
    },
  );
});
