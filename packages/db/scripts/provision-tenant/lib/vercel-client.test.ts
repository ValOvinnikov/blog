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
        JSON.stringify({ domains: [{ name: 'acme.example.com' }] }),
        { status: 200 },
      ),
    );

    const result = await listVercelProjectDomains({
      token: 'tok',
      teamId: undefined,
      projectId: 'prj_1',
    });

    expect(result).toEqual([{ name: 'acme.example.com' }]);
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe('https://api.vercel.com/v9/projects/prj_1/domains');
  });
});

describe(addVercelProjectDomain, () => {
  it('POSTs the domain name to the project', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ name: 'acme.example.com' }), {
        status: 200,
      }),
    );

    await addVercelProjectDomain({
      token: 'tok',
      teamId: undefined,
      projectId: 'prj_1',
      domain: 'acme.example.com',
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.vercel.com/v10/projects/prj_1/domains');
    expect(JSON.parse(init.body as string)).toEqual({
      name: 'acme.example.com',
    });
  });

  it('throws with the response status and body on failure', async () => {
    fetchMock.mockResolvedValue(new Response('bad request', { status: 400 }));

    await expect(
      addVercelProjectDomain({
        token: 'tok',
        teamId: undefined,
        projectId: 'prj_1',
        domain: 'acme.example.com',
      }),
    ).rejects.toThrow(/400/);
  });
});
