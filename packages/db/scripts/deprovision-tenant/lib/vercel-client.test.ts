import { deleteVercelProject, deleteVercelProjectDomain } from './vercel-client';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(deleteVercelProjectDomain, () => {
  it('DELETEs the project domain', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

    const result = await deleteVercelProjectDomain({
      token: 'tok',
      teamId: undefined,
      projectId: 'prj_1',
      domain: 'acme.example.com',
    });

    expect(result).toEqual({ alreadyGone: false });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://api.vercel.com/v9/projects/prj_1/domains/acme.example.com',
    );
    expect(init.method).toBe('DELETE');
  });

  it('appends teamId as a query param when supplied', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

    await deleteVercelProjectDomain({
      token: 'tok',
      teamId: 'team_1',
      projectId: 'prj_1',
      domain: 'acme.example.com',
    });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe(
      'https://api.vercel.com/v9/projects/prj_1/domains/acme.example.com?teamId=team_1',
    );
  });

  it('treats a 404 as already gone rather than an error', async () => {
    fetchMock.mockResolvedValue(new Response('not found', { status: 404 }));

    const result = await deleteVercelProjectDomain({
      token: 'tok',
      teamId: undefined,
      projectId: 'prj_1',
      domain: 'acme.example.com',
    });

    expect(result).toEqual({ alreadyGone: true });
  });

  it('throws with the response status and body on failure', async () => {
    fetchMock.mockResolvedValue(new Response('bad request', { status: 400 }));

    await expect(
      deleteVercelProjectDomain({
        token: 'tok',
        teamId: undefined,
        projectId: 'prj_1',
        domain: 'acme.example.com',
      }),
    ).rejects.toThrow(/400/);
  });
});

describe(deleteVercelProject, () => {
  it('DELETEs the project', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    const result = await deleteVercelProject({
      token: 'tok',
      teamId: undefined,
      projectId: 'prj_1',
    });

    expect(result).toEqual({ alreadyGone: false });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.vercel.com/v9/projects/prj_1');
    expect(init.method).toBe('DELETE');
  });

  it('treats a 404 as already gone rather than an error', async () => {
    fetchMock.mockResolvedValue(new Response('not found', { status: 404 }));

    const result = await deleteVercelProject({
      token: 'tok',
      teamId: undefined,
      projectId: 'prj_1',
    });

    expect(result).toEqual({ alreadyGone: true });
  });
});
