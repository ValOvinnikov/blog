import { deleteSanityProject } from './sanity-management-client';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(deleteSanityProject, () => {
  it('DELETEs the project', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

    const result = await deleteSanityProject({
      token: 'mgmt-token',
      projectId: 'proj123',
    });

    expect(result).toEqual({ alreadyGone: false });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.sanity.io/v2021-06-07/projects/proj123');
    expect(init.method).toBe('DELETE');
  });

  it('treats a 404 as already gone rather than an error', async () => {
    fetchMock.mockResolvedValue(new Response('not found', { status: 404 }));

    const result = await deleteSanityProject({
      token: 'mgmt-token',
      projectId: 'proj123',
    });

    expect(result).toEqual({ alreadyGone: true });
  });

  it('throws with the response status and body on failure', async () => {
    fetchMock.mockResolvedValue(new Response('forbidden', { status: 403 }));

    await expect(
      deleteSanityProject({ token: 'mgmt-token', projectId: 'proj123' }),
    ).rejects.toThrow(/403/);
  });

  it('reports blockedByBillingPermission on the org-billing 401, without throwing', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 401,
          status: 'Unauthorized',
          message:
            'Cancellation of project "proj123" requires billing permission on organization "org1"',
        }),
        { status: 401 },
      ),
    );

    const result = await deleteSanityProject({
      token: 'mgmt-token',
      projectId: 'proj123',
    });

    expect(result).toEqual({
      alreadyGone: false,
      blockedByBillingPermission: true,
    });
  });

  it('still throws on a 401 unrelated to billing permission', async () => {
    fetchMock.mockResolvedValue(new Response('invalid token', { status: 401 }));

    await expect(
      deleteSanityProject({ token: 'mgmt-token', projectId: 'proj123' }),
    ).rejects.toThrow(/401/);
  });
});
