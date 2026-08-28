import { dispatchDeprovisioningWorkflow } from './dispatch-deprovisioning-workflow';

const { envMock } = vi.hoisted(() => ({
  envMock: {
    TENANT_PROVISIONING_GITHUB_TOKEN: undefined as string | undefined,
    TENANT_PROVISIONING_GITHUB_REPO: undefined as string | undefined,
    TENANT_PROVISIONING_DATASET: undefined as
      'development' | 'production' | undefined,
  },
}));

vi.mock('@platform/utils/env/env', () => ({ env: envMock }));

describe(dispatchDeprovisioningWorkflow, () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    envMock.TENANT_PROVISIONING_GITHUB_TOKEN = 'ghp_token';
    envMock.TENANT_PROVISIONING_GITHUB_REPO = 'acme-org/acme-repo';
    envMock.TENANT_PROVISIONING_DATASET = undefined;
  });

  it('skips the dispatch call and returns false when no token is configured', async () => {
    envMock.TENANT_PROVISIONING_GITHUB_TOKEN = undefined;

    const result = await dispatchDeprovisioningWorkflow({
      tenantId: 'tenant-1',
      confirm: 'acme',
      dryRun: true,
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it('skips the dispatch call and returns false when no repo is configured', async () => {
    envMock.TENANT_PROVISIONING_GITHUB_REPO = undefined;

    const result = await dispatchDeprovisioningWorkflow({
      tenantId: 'tenant-1',
      confirm: 'acme',
      dryRun: true,
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it('POSTs a workflow_dispatch request with tenantId, confirm, and dryRun as inputs, and returns true', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    const result = await dispatchDeprovisioningWorkflow({
      tenantId: 'tenant-1',
      confirm: 'acme',
      dryRun: true,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/acme-org/acme-repo/actions/workflows/deprovision-tenant.yml/dispatches',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer ghp_token',
        }),
        body: JSON.stringify({
          ref: 'main',
          inputs: { tenantId: 'tenant-1', confirm: 'acme', dryRun: 'true' },
        }),
      }),
    );
    expect(result).toBe(true);
  });

  it('omits environment from the dispatch body when TENANT_PROVISIONING_DATASET is not configured', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await dispatchDeprovisioningWorkflow({
      tenantId: 'tenant-1',
      confirm: 'acme',
      dryRun: true,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({
          ref: 'main',
          inputs: { tenantId: 'tenant-1', confirm: 'acme', dryRun: 'true' },
        }),
      }),
    );
  });

  it('includes environment from TENANT_PROVISIONING_DATASET in the dispatch body when configured', async () => {
    envMock.TENANT_PROVISIONING_DATASET = 'development';
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await dispatchDeprovisioningWorkflow({
      tenantId: 'tenant-1',
      confirm: 'acme',
      dryRun: true,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            tenantId: 'tenant-1',
            confirm: 'acme',
            dryRun: 'true',
            environment: 'development',
          },
        }),
      }),
    );
  });

  it('never throws, and returns false, when the dispatch call responds with a non-2xx status', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }));

    await expect(
      dispatchDeprovisioningWorkflow({
        tenantId: 'tenant-1',
        confirm: 'acme',
        dryRun: true,
      }),
    ).resolves.toBe(false);
  });

  it('never throws, and returns false, when the request itself fails', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));

    await expect(
      dispatchDeprovisioningWorkflow({
        tenantId: 'tenant-1',
        confirm: 'acme',
        dryRun: true,
      }),
    ).resolves.toBe(false);
  });

  it('never throws, and returns false, when the request times out', async () => {
    fetchMock.mockRejectedValue(
      new DOMException('The operation timed out.', 'TimeoutError'),
    );

    await expect(
      dispatchDeprovisioningWorkflow({
        tenantId: 'tenant-1',
        confirm: 'acme',
        dryRun: true,
      }),
    ).resolves.toBe(false);
  });
});
