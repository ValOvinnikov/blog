import {
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/config/constants';

import { reportStepStatus } from './status-callback';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(reportStepStatus, () => {
  it('POSTs the step payload to the callback route with a bearer token', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

    await reportStepStatus({
      baseUrl: 'https://admin.example.com',
      secret: 'shh',
      tenantId: 'tenant-1',
      step: TENANT_PROVISIONING_STEP.SANITY_PROJECT,
      status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://admin.example.com/api/provisioning/status-callback',
    );
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Authorization']).toBe(
      'Bearer shh',
    );
    expect(JSON.parse(init.body as string)).toEqual({
      tenantId: 'tenant-1',
      step: TENANT_PROVISIONING_STEP.SANITY_PROJECT,
      status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
    });
  });

  it('includes the error field only when supplied', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

    await reportStepStatus({
      baseUrl: 'https://admin.example.com',
      secret: 'shh',
      tenantId: 'tenant-1',
      step: TENANT_PROVISIONING_STEP.SEED_CONTENT,
      status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
      error: 'something broke',
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toMatchObject({
      error: 'something broke',
    });
  });

  it('never throws when the callback request fails', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));

    await expect(
      reportStepStatus({
        baseUrl: 'https://admin.example.com',
        secret: 'shh',
        tenantId: 'tenant-1',
        step: TENANT_PROVISIONING_STEP.MAP_DOMAIN,
        status: TENANT_PROVISIONING_STEP_STATUS.DONE,
      }),
    ).resolves.toBeUndefined();
  });

  it('never throws on a non-2xx response', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));

    await expect(
      reportStepStatus({
        baseUrl: 'https://admin.example.com',
        secret: 'shh',
        tenantId: 'tenant-1',
        step: TENANT_PROVISIONING_STEP.MAP_DOMAIN,
        status: TENANT_PROVISIONING_STEP_STATUS.DONE,
      }),
    ).resolves.toBeUndefined();
  });
});
