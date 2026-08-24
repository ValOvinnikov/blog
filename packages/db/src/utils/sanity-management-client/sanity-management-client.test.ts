import {
  archiveSanityProject,
  deleteSanityProject,
} from './sanity-management-client';

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

function projectResponse(isDisabledByUser: boolean): Response {
  return new Response(
    JSON.stringify({ id: 'proj123', isDisabled: false, isDisabledByUser }),
    { status: 200 },
  );
}

describe(archiveSanityProject, () => {
  it('GETs the project, then PATCHes isDisabledByUser to true when not already archived', async () => {
    fetchMock
      .mockResolvedValueOnce(projectResponse(false))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ isDisabledByUser: true }), {
          status: 200,
        }),
      );

    const result = await archiveSanityProject({
      token: 'mgmt-token',
      projectId: 'proj123',
    });

    expect(result).toEqual({ outcome: 'archived' });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [getUrl, getInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(getUrl).toBe('https://api.sanity.io/v2021-06-07/projects/proj123');
    expect(getInit.method).toBeUndefined();

    const [patchUrl, patchInit] = fetchMock.mock.calls[1] as [
      string,
      RequestInit,
    ];
    expect(patchUrl).toBe('https://api.sanity.io/v2021-06-07/projects/proj123');
    expect(patchInit.method).toBe('PATCH');
    expect(patchInit.body).toBe(JSON.stringify({ isDisabledByUser: true }));
  });

  it('is idempotent — skips the PATCH when the project is already archived', async () => {
    fetchMock.mockResolvedValueOnce(projectResponse(true));

    const result = await archiveSanityProject({
      token: 'mgmt-token',
      projectId: 'proj123',
    });

    expect(result).toEqual({ outcome: 'already-archived' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('treats a 404 on the GET as already gone rather than an error', async () => {
    fetchMock.mockResolvedValueOnce(new Response('not found', { status: 404 }));

    const result = await archiveSanityProject({
      token: 'mgmt-token',
      projectId: 'proj123',
    });

    expect(result).toEqual({ outcome: 'already-gone' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws when the GET fails for a reason other than 404', async () => {
    fetchMock.mockResolvedValueOnce(new Response('forbidden', { status: 403 }));

    await expect(
      archiveSanityProject({ token: 'mgmt-token', projectId: 'proj123' }),
    ).rejects.toThrow(/403/);
  });

  it('throws when the PATCH fails', async () => {
    fetchMock
      .mockResolvedValueOnce(projectResponse(false))
      .mockResolvedValueOnce(new Response('server error', { status: 500 }));

    await expect(
      archiveSanityProject({ token: 'mgmt-token', projectId: 'proj123' }),
    ).rejects.toThrow(/500/);
  });
});
