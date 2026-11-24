import { faker } from '@faker-js/faker';
import { RELEASE_LOG } from '@platform/constants/release';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { MOCK_GITHUB_DEV_DEPLOY_DISPATCH_PATH } from '@platform/testing/github/fixtures';
import {
  mockGitHubResponse,
  useGitHubFetch,
} from '@platform/testing/github/github-fetch';
import { logger } from '@platform/utils/logger/logger';
import {
  ACTION_OUTCOME,
  HTTP_STATUS,
  NEXT_NAVIGATION_ERROR,
} from '@shinefold/config';

import { startDevDeployAction } from './start-dev-deploy-action';

faker.seed(5282);

vi.mock('@platform/utils/env/env');

vi.mock('@platform/utils/logger/logger');

vi.mock('@platform/server/auth/require-super-admin');

describe(startDevDeployAction, () => {
  const github = useGitHubFetch();

  const isDispatched = () =>
    github.fetchMock.mock.calls.some(([url]) =>
      String(url).endsWith(MOCK_GITHUB_DEV_DEPLOY_DISPATCH_PATH),
    );

  beforeEach(() => {
    github.respond(
      MOCK_GITHUB_DEV_DEPLOY_DISPATCH_PATH,
      () => new Response(null, { status: HTTP_STATUS.NO_CONTENT }),
    );
  });

  it('requires a super-admin before dispatching anything', async () => {
    vi.mocked(requireSuperAdmin).mockRejectedValueOnce(
      new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND),
    );

    await expect(startDevDeployAction()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );

    expect(isDispatched()).toBe(false);
  });

  it('dispatches the development deploy and logs who started it', async () => {
    const { userId } = await vi.mocked(requireSuperAdmin)();

    const result = await startDevDeployAction();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(isDispatched()).toBe(true);
    expect(logger.info).toHaveBeenCalledWith(
      RELEASE_LOG.DEV_DEPLOY_DISPATCHED,
      { actorId: userId },
    );
  });

  it('answers a server error and logs no start when the dispatch fails', async () => {
    github.respond(MOCK_GITHUB_DEV_DEPLOY_DISPATCH_PATH, () =>
      mockGitHubResponse({}, HTTP_STATUS.INTERNAL_SERVER_ERROR),
    );

    const result = await startDevDeployAction();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.info).not.toHaveBeenCalled();
  });
});
