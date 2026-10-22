import { HTTP_METHOD, HTTP_STATUS } from '@blog/config';

import { deleteVercelProjectDomain } from './vercel-project-domains';

const originalFetch = globalThis.fetch;
const fetchMock = vi.fn();

const DOMAIN_INPUT = {
  token: 'tok',
  teamId: undefined,
  projectId: 'prj_1',
  domain: 'domain-to-remove.example.com',
};

beforeEach(() => {
  globalThis.fetch = fetchMock;
  fetchMock
    .mockReset()
    .mockResolvedValue(new Response(null, { status: HTTP_STATUS.OK }));
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe(deleteVercelProjectDomain, () => {
  it('DELETEs the project domain', async () => {
    const result = await deleteVercelProjectDomain(DOMAIN_INPUT);

    expect(result).toEqual({ alreadyGone: false });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://api.vercel.com/v9/projects/prj_1/domains/domain-to-remove.example.com',
    );
    expect(init.method).toBe(HTTP_METHOD.DELETE);
  });

  it('appends teamId as a query param when supplied', async () => {
    await deleteVercelProjectDomain({ ...DOMAIN_INPUT, teamId: 'team_1' });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe(
      'https://api.vercel.com/v9/projects/prj_1/domains/domain-to-remove.example.com?teamId=team_1',
    );
  });

  it('treats a 404 as already gone rather than an error', async () => {
    fetchMock.mockResolvedValue(
      new Response('not found', { status: HTTP_STATUS.NOT_FOUND }),
    );

    await expect(deleteVercelProjectDomain(DOMAIN_INPUT)).resolves.toEqual({
      alreadyGone: true,
    });
  });

  it('throws with the response status and body on failure', async () => {
    fetchMock.mockResolvedValue(
      new Response('bad request', { status: HTTP_STATUS.BAD_REQUEST }),
    );

    await expect(deleteVercelProjectDomain(DOMAIN_INPUT)).rejects.toThrow(
      /400 bad request/,
    );
  });
});
