import { HTTP_STATUS, HTTP_METHOD } from '@blog/config';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { env } from '@platform/utils/env/env';

import { dispatchDeprovisioningWorkflow } from './dispatch-deprovisioning-workflow';

vi.mock('@platform/utils/env/env');

const envMock: Partial<Record<keyof typeof env, string>> = env;

const DISPATCH_INPUT = {
  tenantId: MOCK_TENANT_ID,
  confirm: 'acme',
  dryRun: true,
};

describe(dispatchDeprovisioningWorkflow, () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    envMock.TENANT_PROVISIONING_GITHUB_TOKEN = 'ghp_token';
    envMock.TENANT_PROVISIONING_GITHUB_REPO = 'acme-org/acme-repo';
    envMock.TENANT_PROVISIONING_DATASET = undefined;
    fetchMock.mockResolvedValue(
      new Response(null, { status: HTTP_STATUS.NO_CONTENT }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    'TENANT_PROVISIONING_GITHUB_TOKEN',
    'TENANT_PROVISIONING_GITHUB_REPO',
  ] as const)(
    'skips the dispatch and returns false without %s',
    async (key) => {
      envMock[key] = undefined;

      const result = await dispatchDeprovisioningWorkflow(DISPATCH_INPUT);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result).toBe(false);
    },
  );

  it('POSTs a workflow_dispatch with tenantId, confirm and dryRun, and returns true', async () => {
    const result = await dispatchDeprovisioningWorkflow(DISPATCH_INPUT);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/acme-org/acme-repo/actions/workflows/deprovision-tenant.yml/dispatches',
      expect.objectContaining({
        method: HTTP_METHOD.POST,
        headers: expect.objectContaining({
          Authorization: 'Bearer ghp_token',
        }),
        body: JSON.stringify({
          ref: 'main',
          inputs: { tenantId: MOCK_TENANT_ID, confirm: 'acme', dryRun: 'true' },
        }),
      }),
    );
    expect(result).toBe(true);
  });

  it('sends environment from TENANT_PROVISIONING_DATASET when configured', async () => {
    envMock.TENANT_PROVISIONING_DATASET = 'development';
    await dispatchDeprovisioningWorkflow(DISPATCH_INPUT);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            tenantId: MOCK_TENANT_ID,
            confirm: 'acme',
            dryRun: 'true',
            environment: 'development',
          },
        }),
      }),
    );
  });

  it.each([
    [
      'the dispatch responds non-2xx',
      () =>
        fetchMock.mockResolvedValue(
          new Response(null, { status: HTTP_STATUS.NOT_FOUND }),
        ),
    ],
    [
      'the request itself fails',
      () => fetchMock.mockRejectedValue(new Error('network down')),
    ],
    [
      'the request times out',
      () =>
        fetchMock.mockRejectedValue(
          new DOMException('The operation timed out.', 'TimeoutError'),
        ),
    ],
  ])('returns false without throwing when %s', async (_case, arrange) => {
    arrange();

    await expect(dispatchDeprovisioningWorkflow(DISPATCH_INPUT)).resolves.toBe(
      false,
    );
  });
});
