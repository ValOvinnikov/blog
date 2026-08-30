import { dispatchGitHubWorkflow } from './dispatch-github-workflow';

const { envMock, loggerErrorMock } = vi.hoisted(() => ({
  envMock: {
    TENANT_PROVISIONING_GITHUB_TOKEN: undefined as string | undefined,
    TENANT_PROVISIONING_GITHUB_REPO: undefined as string | undefined,
  },
  loggerErrorMock: vi.fn(),
}));

vi.mock('@platform/utils/env/env', () => ({ env: envMock }));
vi.mock('@platform/utils/logger/logger', () => ({
  logger: { error: loggerErrorMock },
}));

describe(dispatchGitHubWorkflow, () => {
  const fetchMock = vi.fn();

  const dispatch = (inputs: Record<string, string | undefined> = {}) =>
    dispatchGitHubWorkflow({
      workflowFile: 'some-workflow.yml',
      inputs,
      logEvents: { skipped: 'x.skipped', failed: 'x.failed', error: 'x.error' },
      logContext: { tenantId: 'tenant-1' },
    });

  beforeEach(() => {
    fetchMock.mockReset();
    loggerErrorMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    envMock.TENANT_PROVISIONING_GITHUB_TOKEN = 'ghp_token';
    envMock.TENANT_PROVISIONING_GITHUB_REPO = 'acme-org/acme-repo';
  });

  it('skips the dispatch call, logs the skipped event, and returns false when no token is configured', async () => {
    envMock.TENANT_PROVISIONING_GITHUB_TOKEN = undefined;

    const result = await dispatch();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(loggerErrorMock).toHaveBeenCalledWith('x.skipped', {
      tenantId: 'tenant-1',
    });
    expect(result).toBe(false);
  });

  it('skips the dispatch call and returns false when no repo is configured', async () => {
    envMock.TENANT_PROVISIONING_GITHUB_REPO = undefined;

    const result = await dispatch();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it('POSTs a workflow_dispatch request built from the given workflow file and inputs, and returns true', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    const result = await dispatch({ tenantId: 'tenant-1' });

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/acme-org/acme-repo/actions/workflows/some-workflow.yml/dispatches',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer ghp_token',
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          ref: 'main',
          inputs: { tenantId: 'tenant-1' },
        }),
      }),
    );
  });

  it('omits an undefined input from the dispatch body', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await dispatch({ tenantId: 'tenant-1', environment: undefined });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({
          ref: 'main',
          inputs: { tenantId: 'tenant-1' },
        }),
      }),
    );
  });

  it('logs the failed event with the response status, and returns false, on a non-2xx response', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }));

    const result = await dispatch();

    expect(result).toBe(false);
    expect(loggerErrorMock).toHaveBeenCalledWith('x.failed', {
      tenantId: 'tenant-1',
      responseStatus: 404,
    });
  });

  it('logs the error event with the thrown error, and returns false, when the request itself fails', async () => {
    const thrown = new Error('network down');
    fetchMock.mockRejectedValue(thrown);

    const result = await dispatch();

    expect(result).toBe(false);
    expect(loggerErrorMock).toHaveBeenCalledWith('x.error', {
      tenantId: 'tenant-1',
      error: thrown,
    });
  });
});
