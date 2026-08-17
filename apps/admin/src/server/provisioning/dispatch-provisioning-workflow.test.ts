import { dispatchProvisioningWorkflow } from './dispatch-provisioning-workflow';

const { envMock } = vi.hoisted(() => ({
  envMock: {
    TENANT_PROVISIONING_GITHUB_TOKEN: undefined as string | undefined,
    TENANT_PROVISIONING_GITHUB_REPO: undefined as string | undefined,
  },
}));

vi.mock('@admin/utils/env/env', () => ({ env: envMock }));

describe(dispatchProvisioningWorkflow, () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    envMock.TENANT_PROVISIONING_GITHUB_TOKEN = 'ghp_token';
    envMock.TENANT_PROVISIONING_GITHUB_REPO = 'acme-org/acme-repo';
  });

  it('skips the dispatch call when no token is configured', async () => {
    envMock.TENANT_PROVISIONING_GITHUB_TOKEN = undefined;

    await dispatchProvisioningWorkflow('tenant-1');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('skips the dispatch call when no repo is configured', async () => {
    envMock.TENANT_PROVISIONING_GITHUB_REPO = undefined;

    await dispatchProvisioningWorkflow('tenant-1');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('POSTs a workflow_dispatch request with the tenant id as an input', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await dispatchProvisioningWorkflow('tenant-1');

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

  it('never throws when the dispatch call responds with a non-2xx status (e.g. the workflow not existing yet)', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }));

    await expect(
      dispatchProvisioningWorkflow('tenant-1'),
    ).resolves.toBeUndefined();
  });

  it('never throws when the request itself fails', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));

    await expect(
      dispatchProvisioningWorkflow('tenant-1'),
    ).resolves.toBeUndefined();
  });
});
