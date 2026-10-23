import { HTTP_STATUS } from '@blog/config/constants';
import { MOCK_TENANT_DOMAIN } from '@worker/testing/tenant/fixtures';

import {
  addVercelProjectDomain,
  listVercelProjectDomains,
} from './vercel-client';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(listVercelProjectDomains, () => {
  it('GETs the project domains list', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ domains: [{ name: MOCK_TENANT_DOMAIN }] }),
        { status: HTTP_STATUS.OK },
      ),
    );

    const result = await listVercelProjectDomains({
      token: 'tok',
      teamId: undefined,
      projectId: 'prj_1',
    });

    expect(result).toEqual([{ name: MOCK_TENANT_DOMAIN }]);
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe('https://api.vercel.com/v9/projects/prj_1/domains');
  });

  it('sends an abort signal so a hung call fails instead of stalling the run', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ domains: [] }), { status: HTTP_STATUS.OK }),
    );

    await listVercelProjectDomains({
      token: 'tok',
      teamId: undefined,
      projectId: 'prj_1',
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
});

describe(addVercelProjectDomain, () => {
  it('POSTs the domain name to the project', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ name: MOCK_TENANT_DOMAIN }), {
        status: HTTP_STATUS.OK,
      }),
    );

    await addVercelProjectDomain({
      token: 'tok',
      teamId: undefined,
      projectId: 'prj_1',
      domain: MOCK_TENANT_DOMAIN,
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.vercel.com/v10/projects/prj_1/domains');
    expect(JSON.parse(init.body as string)).toEqual({
      name: MOCK_TENANT_DOMAIN,
    });
  });

  it('throws with the response status and body on failure', async () => {
    fetchMock.mockResolvedValue(
      new Response('bad request', { status: HTTP_STATUS.BAD_REQUEST }),
    );

    await expect(
      addVercelProjectDomain({
        token: 'tok',
        teamId: undefined,
        projectId: 'prj_1',
        domain: MOCK_TENANT_DOMAIN,
      }),
    ).rejects.toThrow(/400/);
  });
});
