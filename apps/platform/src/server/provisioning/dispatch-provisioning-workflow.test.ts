import { env } from '@platform/utils/env/env';

import { dispatchProvisioningWorkflow } from './dispatch-provisioning-workflow';

vi.mock('@platform/utils/env/env');

const envMock: Partial<Record<keyof typeof env, string>> = env;

describe(dispatchProvisioningWorkflow, () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    envMock.TENANT_PROVISIONING_GITHUB_TOKEN = 'ghp_token';
    envMock.TENANT_PROVISIONING_GITHUB_REPO = 'acme-org/acme-repo';
    envMock.TENANT_PROVISIONING_ADMIN_BASE_URL_OVERRIDE = undefined;
    envMock.TENANT_PROVISIONING_DATASET = undefined;
  });

  it('skips the dispatch call and returns false when no token is configured', async () => {
    envMock.TENANT_PROVISIONING_GITHUB_TOKEN = undefined;

    const result = await dispatchProvisioningWorkflow('tenant-1');

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it('skips the dispatch call and returns false when no repo is configured', async () => {
    envMock.TENANT_PROVISIONING_GITHUB_REPO = undefined;

    const result = await dispatchProvisioningWorkflow('tenant-1');

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it('POSTs a workflow_dispatch with the tenant id as an input, and returns true', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    const result = await dispatchProvisioningWorkflow('tenant-1');

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/acme-org/acme-repo/actions/workflows/provision-tenant.yml/dispatches',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer ghp_token',
        }),
        body: JSON.stringify({ ref: 'main', inputs: { tenantId: 'tenant-1' } }),
      }),
    );
  });

  it('omits adminAppBaseUrl from the dispatch body when no override is configured', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await dispatchProvisioningWorkflow('tenant-1');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/acme-org/acme-repo/actions/workflows/provision-tenant.yml/dispatches',
      expect.objectContaining({
        body: JSON.stringify({ ref: 'main', inputs: { tenantId: 'tenant-1' } }),
      }),
    );
  });

  it('sends adminAppBaseUrl when the local-dev override is configured', async () => {
    envMock.TENANT_PROVISIONING_ADMIN_BASE_URL_OVERRIDE =
      'https://tenant-dev.tailnet.ts.net';
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await dispatchProvisioningWorkflow('tenant-1');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/acme-org/acme-repo/actions/workflows/provision-tenant.yml/dispatches',
      expect.objectContaining({
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            tenantId: 'tenant-1',
            adminAppBaseUrl: 'https://tenant-dev.tailnet.ts.net',
            tenantSanityDataset: 'development',
            environment: 'development',
          },
        }),
      }),
    );
  });

  it('omits tenantSanityDataset and environment when neither override nor dataset set', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await dispatchProvisioningWorkflow('tenant-1');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({ ref: 'main', inputs: { tenantId: 'tenant-1' } }),
      }),
    );
  });

  it('sends tenantSanityDataset and environment from the dataset with no override', async () => {
    envMock.TENANT_PROVISIONING_DATASET = 'production';
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await dispatchProvisioningWorkflow('tenant-1');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            tenantId: 'tenant-1',
            tenantSanityDataset: 'production',
            environment: 'production',
          },
        }),
      }),
    );
  });

  it('sends "development" for dataset and environment whenever the override is set', async () => {
    envMock.TENANT_PROVISIONING_ADMIN_BASE_URL_OVERRIDE =
      'https://tenant-dev.tailnet.ts.net';
    envMock.TENANT_PROVISIONING_DATASET = 'production';
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await dispatchProvisioningWorkflow('tenant-1');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            tenantId: 'tenant-1',
            adminAppBaseUrl: 'https://tenant-dev.tailnet.ts.net',
            tenantSanityDataset: 'development',
            environment: 'development',
          },
        }),
      }),
    );
  });

  it('returns false without throwing when the dispatch responds non-2xx', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }));

    await expect(dispatchProvisioningWorkflow('tenant-1')).resolves.toBe(false);
  });

  it('never throws, and returns false, when the request itself fails', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));

    await expect(dispatchProvisioningWorkflow('tenant-1')).resolves.toBe(false);
  });
});
