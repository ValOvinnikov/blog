import { HTTP_METHOD, HTTP_STATUS, type TMaybeUndefined } from '@blog/config';
import { faker } from '@faker-js/faker';
import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';

import { dispatchGitHubWorkflow } from './dispatch-github-workflow';

vi.mock('@platform/utils/env/env');

const envMock: Partial<Record<keyof typeof env, string>> = env;

const loggerErrorMock = vi.mocked(logger.error);

describe(dispatchGitHubWorkflow, () => {
  const fetchMock = vi.fn();
  const token = `ghp_${faker.string.alphanumeric(36)}`;
  const owner = faker.lorem.slug();
  const repo = faker.lorem.slug();
  const workflowFile = `${faker.lorem.slug()}.yml`;
  const tenantId = faker.string.uuid();

  const dispatch = (
    inputs: Record<string, TMaybeUndefined<string>> = {},
    ref?: string,
  ) =>
    dispatchGitHubWorkflow({
      workflowFile,
      ref,
      inputs,
      logEvents: { skipped: 'x.skipped', failed: 'x.failed', error: 'x.error' },
      logContext: { tenantId },
    });

  beforeEach(() => {
    fetchMock.mockReset();
    loggerErrorMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    envMock.TENANT_PROVISIONING_GITHUB_TOKEN = token;
    envMock.TENANT_PROVISIONING_GITHUB_REPO = `${owner}/${repo}`;
  });

  it('skips the dispatch, logs it, and returns false when no token is configured', async () => {
    envMock.TENANT_PROVISIONING_GITHUB_TOKEN = undefined;

    const result = await dispatch();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(loggerErrorMock).toHaveBeenCalledWith('x.skipped', { tenantId });
    expect(result).toBe(false);
  });

  it('skips the dispatch call and returns false when no repo is configured', async () => {
    envMock.TENANT_PROVISIONING_GITHUB_REPO = undefined;

    const result = await dispatch();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it('POSTs a workflow_dispatch built from the file and inputs, and returns true', async () => {
    fetchMock.mockResolvedValue(
      new Response(null, { status: HTTP_STATUS.NO_CONTENT }),
    );

    const result = await dispatch({ tenantId });

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`,
      expect.objectContaining({
        method: HTTP_METHOD.POST,
        headers: expect.objectContaining({
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ ref: 'main', inputs: { tenantId } }),
      }),
    );
  });

  it('omits an undefined input from the dispatch body', async () => {
    fetchMock.mockResolvedValue(
      new Response(null, { status: HTTP_STATUS.NO_CONTENT }),
    );

    await dispatch({ tenantId, environment: undefined });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({ ref: 'main', inputs: { tenantId } }),
      }),
    );
  });

  it('dispatches against the given ref instead of main', async () => {
    fetchMock.mockResolvedValue(
      new Response(null, { status: HTTP_STATUS.NO_CONTENT }),
    );
    const ref = `release/v${faker.system.semver()}`;

    await dispatch({ tenantId }, ref);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({ ref, inputs: { tenantId } }),
      }),
    );
  });

  it('logs the failure with the response status and returns false on a non-2xx', async () => {
    const responseStatus = faker.internet.httpStatusCode({
      types: ['clientError', 'serverError'],
    });
    fetchMock.mockResolvedValue(new Response(null, { status: responseStatus }));

    const result = await dispatch();

    expect(result).toBe(false);
    expect(loggerErrorMock).toHaveBeenCalledWith('x.failed', {
      tenantId,
      responseStatus,
    });
  });

  it('logs the thrown error and returns false when the request itself fails', async () => {
    const thrown = new Error(faker.lorem.sentence());
    fetchMock.mockRejectedValue(thrown);

    const result = await dispatch();

    expect(result).toBe(false);
    expect(loggerErrorMock).toHaveBeenCalledWith('x.error', {
      tenantId,
      error: thrown,
    });
  });
});
