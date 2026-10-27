import { HTTP_METHOD, HTTP_STATUS, type TMaybeUndefined } from '@blog/config';
import { faker } from '@faker-js/faker';
import { useGitHubFetch } from '@platform/testing/github/github-fetch';
import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';

import { dispatchGitHubWorkflow } from './dispatch-github-workflow';

faker.seed(5998);

vi.mock('@platform/utils/env/env');

const envMock: Partial<Record<keyof typeof env, string>> = env;

const MOCK_WORKFLOW_FILE = `${faker.lorem.slug()}.yml`;
const MOCK_TENANT_ID = faker.string.uuid();
const MOCK_SKIPPED_EVENT = faker.lorem.slug();
const MOCK_FAILED_EVENT = faker.lorem.slug();
const MOCK_ERROR_EVENT = faker.lorem.slug();
const DEFAULT_REF = 'main';
const NO_CONTENT_RESPONSE = () =>
  new Response(null, { status: HTTP_STATUS.NO_CONTENT });

describe(dispatchGitHubWorkflow, () => {
  const github = useGitHubFetch();

  const dispatch = (
    inputs: Record<string, TMaybeUndefined<string>> = {},
    ref?: string,
  ) =>
    dispatchGitHubWorkflow({
      workflowFile: MOCK_WORKFLOW_FILE,
      ref,
      inputs,
      logEvents: {
        skipped: MOCK_SKIPPED_EVENT,
        failed: MOCK_FAILED_EVENT,
        error: MOCK_ERROR_EVENT,
      },
      logContext: { tenantId: MOCK_TENANT_ID },
    });

  const respondNoContent = () => {
    github.respond(
      `/actions/workflows/${MOCK_WORKFLOW_FILE}/dispatches`,
      NO_CONTENT_RESPONSE,
    );
  };

  const readDispatchBody = () => {
    const [, init] = github.fetchMock.mock.calls[0] as [string, RequestInit];
    return init.body;
  };

  it('skips the dispatch and logs it when no token is configured', async () => {
    github.unsetToken();

    const result = await dispatch();

    expect(github.fetchMock).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(MOCK_SKIPPED_EVENT, {
      tenantId: MOCK_TENANT_ID,
    });
    expect(result).toBe(false);
  });

  it('skips the dispatch call when no repo is configured', async () => {
    envMock.TENANT_PROVISIONING_GITHUB_REPO = undefined;

    const result = await dispatch();

    expect(github.fetchMock).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it('POSTs the workflow file and inputs with the token, and returns true', async () => {
    respondNoContent();

    const result = await dispatch({ tenantId: MOCK_TENANT_ID });

    const [url, init] = github.fetchMock.mock.calls[0] as [string, RequestInit];
    expect(result).toBe(true);
    expect(url).toBe(
      `https://api.github.com/repos/${env.TENANT_PROVISIONING_GITHUB_REPO}/actions/workflows/${MOCK_WORKFLOW_FILE}/dispatches`,
    );
    expect(init.method).toBe(HTTP_METHOD.POST);
    expect(init.headers).toEqual({
      Authorization: `Bearer ${env.TENANT_PROVISIONING_GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    });
    expect(init.body).toBe(
      JSON.stringify({
        ref: DEFAULT_REF,
        inputs: { tenantId: MOCK_TENANT_ID },
      }),
    );
  });

  it('omits an undefined input from the dispatch body', async () => {
    respondNoContent();

    await dispatch({ tenantId: MOCK_TENANT_ID, environment: undefined });

    expect(readDispatchBody()).toBe(
      JSON.stringify({
        ref: DEFAULT_REF,
        inputs: { tenantId: MOCK_TENANT_ID },
      }),
    );
  });

  it('dispatches against the given ref instead of main', async () => {
    respondNoContent();
    const ref = `release/v${faker.system.semver()}`;

    await dispatch({ tenantId: MOCK_TENANT_ID }, ref);

    expect(readDispatchBody()).toBe(
      JSON.stringify({ ref, inputs: { tenantId: MOCK_TENANT_ID } }),
    );
  });

  it('logs the response status and returns false on a non-2xx', async () => {
    const responseStatus = faker.internet.httpStatusCode({
      types: ['clientError', 'serverError'],
    });
    github.fetchMock.mockResolvedValue(
      new Response(null, { status: responseStatus }),
    );

    const result = await dispatch();

    expect(result).toBe(false);
    expect(logger.error).toHaveBeenCalledWith(MOCK_FAILED_EVENT, {
      tenantId: MOCK_TENANT_ID,
      responseStatus,
    });
  });

  it('logs the thrown error and returns false when the request fails', async () => {
    const thrown = new Error(faker.lorem.sentence());
    github.fetchMock.mockRejectedValue(thrown);

    const result = await dispatch();

    expect(result).toBe(false);
    expect(logger.error).toHaveBeenCalledWith(MOCK_ERROR_EVENT, {
      tenantId: MOCK_TENANT_ID,
      error: thrown,
    });
  });
});
