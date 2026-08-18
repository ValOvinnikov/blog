import {
  addVercelProjectDomain,
  createVercelProject,
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

describe(createVercelProject, () => {
  it('POSTs to /v11/projects with name + rootDirectory + framework + gitRepository', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 'prj_1', name: 'studio-acme' }), {
        status: 200,
      }),
    );

    const result = await createVercelProject({
      token: 'tok',
      teamId: undefined,
      name: 'studio-acme',
      rootDirectory: 'apps/cms',
      gitRepository: 'acme/blog',
    });

    expect(result).toEqual({ id: 'prj_1', name: 'studio-acme' });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.vercel.com/v11/projects');
    expect(JSON.parse(init.body as string)).toEqual({
      name: 'studio-acme',
      rootDirectory: 'apps/cms',
      framework: 'sanity',
      gitRepository: { repo: 'acme/blog', type: 'github' },
    });
  });

  it('appends teamId as a query param when supplied', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 'prj_1' }), { status: 200 }),
    );

    await createVercelProject({
      token: 'tok',
      teamId: 'team_1',
      name: 'studio-acme',
      rootDirectory: 'apps/cms',
      gitRepository: 'acme/blog',
    });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe('https://api.vercel.com/v11/projects?teamId=team_1');
  });
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
