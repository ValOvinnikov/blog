import { mockDbConstants } from '@admin/testing/mock-db-constants';

const { updateProvisioningStepMock } = vi.hoisted(() => ({
  updateProvisioningStepMock: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: { tenants: { updateProvisioningStep: updateProvisioningStepMock } },
}));

vi.mock('@admin/utils/env/env', () => ({
  env: { TENANT_PROVISIONING_CALLBACK_SECRET: 'callback-secret' },
}));

const postRequest = (body: unknown, token?: string): Request => {
  const headers: HeadersInit = { 'content-type': 'application/json' };
  if (token !== undefined) headers['authorization'] = `Bearer ${token}`;

  return new Request(
    'https://admin.example.com/api/provisioning/status-callback',
    {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    },
  );
};

const validBody = {
  tenantId: 'tenant-1',
  step: 'SANITY_PROJECT',
  status: 'RUNNING',
};

describe('POST /api/provisioning/status-callback', () => {
  beforeEach(() => {
    updateProvisioningStepMock.mockReset();
    updateProvisioningStepMock.mockResolvedValue({ ok: true, data: {} });
  });

  it('rejects a missing bearer token', async () => {
    const { POST } = await import('./route');

    const response = await POST(postRequest(validBody));

    expect(response.status).toBe(401);
    expect(updateProvisioningStepMock).not.toHaveBeenCalled();
  });

  it('rejects an incorrect bearer token', async () => {
    const { POST } = await import('./route');

    const response = await POST(postRequest(validBody, 'wrong-secret'));

    expect(response.status).toBe(401);
    expect(updateProvisioningStepMock).not.toHaveBeenCalled();
  });

  it('rejects an invalid payload with a valid token', async () => {
    const { POST } = await import('./route');

    const response = await POST(
      postRequest({ tenantId: 'tenant-1' }, 'callback-secret'),
    );

    expect(response.status).toBe(400);
    expect(updateProvisioningStepMock).not.toHaveBeenCalled();
  });

  it('records a mid-sequence step update without touching the overall status', async () => {
    const { POST } = await import('./route');

    const response = await POST(postRequest(validBody, 'callback-secret'));

    expect(response.status).toBe(200);
    expect(updateProvisioningStepMock).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      step: 'SANITY_PROJECT',
      status: 'RUNNING',
    });
  });

  it('passes the error message through for a failed step', async () => {
    const { POST } = await import('./route');

    await POST(
      postRequest(
        {
          tenantId: 'tenant-1',
          step: 'SEED_CONTENT',
          status: 'FAILED',
          error: 'Sanity Projects API returned 429',
        },
        'callback-secret',
      ),
    );

    expect(updateProvisioningStepMock).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      step: 'SEED_CONTENT',
      status: 'FAILED',
      error: 'Sanity Projects API returned 429',
    });
  });

  it('sets the overall status to READY when the last step finishes', async () => {
    const { POST } = await import('./route');

    await POST(
      postRequest(
        { tenantId: 'tenant-1', step: 'CREATE_WEBHOOK', status: 'DONE' },
        'callback-secret',
      ),
    );

    expect(updateProvisioningStepMock).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      step: 'CREATE_WEBHOOK',
      status: 'DONE',
      provisioningStatus: 'READY',
    });
  });

  it('sets the overall status to FAILED when the last step fails', async () => {
    const { POST } = await import('./route');

    await POST(
      postRequest(
        {
          tenantId: 'tenant-1',
          step: 'CREATE_WEBHOOK',
          status: 'FAILED',
          error: 'Webhook creation returned 500',
        },
        'callback-secret',
      ),
    );

    expect(updateProvisioningStepMock).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      step: 'CREATE_WEBHOOK',
      status: 'FAILED',
      error: 'Webhook creation returned 500',
      provisioningStatus: 'FAILED',
    });
  });

  it('leaves the overall status untouched for an earlier failed step', async () => {
    const { POST } = await import('./route');

    await POST(
      postRequest(
        { tenantId: 'tenant-1', step: 'DEPLOY_STUDIO', status: 'FAILED' },
        'callback-secret',
      ),
    );

    expect(updateProvisioningStepMock).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      step: 'DEPLOY_STUDIO',
      status: 'FAILED',
    });
  });

  it('leaves the overall status untouched when MAP_DOMAIN finishes (no longer the terminal step)', async () => {
    const { POST } = await import('./route');

    await POST(
      postRequest(
        { tenantId: 'tenant-1', step: 'MAP_DOMAIN', status: 'DONE' },
        'callback-secret',
      ),
    );

    expect(updateProvisioningStepMock).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      step: 'MAP_DOMAIN',
      status: 'DONE',
    });
  });

  it('responds 404 when updateProvisioningStep reports DB_NOT_FOUND', async () => {
    updateProvisioningStepMock.mockResolvedValue({
      ok: false,
      error: 'DB_NOT_FOUND',
    });
    const { POST } = await import('./route');

    const response = await POST(postRequest(validBody, 'callback-secret'));

    expect(response.status).toBe(404);
  });

  it('responds 500 when updateProvisioningStep reports any other failure', async () => {
    updateProvisioningStepMock.mockResolvedValue({
      ok: false,
      error: 'SOMETHING_ELSE',
    });
    const { POST } = await import('./route');

    const response = await POST(postRequest(validBody, 'callback-secret'));

    expect(response.status).toBe(500);
  });

  it('responds 500 when the secret is not configured', async () => {
    vi.doMock('@admin/utils/env/env', () => ({ env: {} }));
    vi.resetModules();
    const { POST } = await import('./route');

    const response = await POST(postRequest(validBody, 'callback-secret'));

    expect(response.status).toBe(500);
    expect(updateProvisioningStepMock).not.toHaveBeenCalled();
  });
});
