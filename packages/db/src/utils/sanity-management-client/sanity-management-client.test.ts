import {
  archiveSanityProject,
  createSanityRobotToken,
  deleteSanityProject,
  deleteSanityRobotToken,
  listSanityRobotTokens,
  unarchiveSanityProject,
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

    expect(result).toEqual({ outcome: 'deleted' });
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

    expect(result).toEqual({ outcome: 'already-gone' });
  });

  it('throws with the response status and body on failure', async () => {
    fetchMock.mockResolvedValue(new Response('forbidden', { status: 403 }));

    await expect(
      deleteSanityProject({ token: 'mgmt-token', projectId: 'proj123' }),
    ).rejects.toThrow(/403/);
  });

  it('reports blocked-by-billing-permission on the org-billing 401, without throwing', async () => {
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

    expect(result).toEqual({ outcome: 'blocked-by-billing-permission' });
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

describe(unarchiveSanityProject, () => {
  it('GETs the project, then PATCHes isDisabledByUser to false when currently archived', async () => {
    fetchMock
      .mockResolvedValueOnce(projectResponse(true))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ isDisabledByUser: false }), {
          status: 200,
        }),
      );

    const result = await unarchiveSanityProject({
      token: 'mgmt-token',
      projectId: 'proj123',
    });

    expect(result).toEqual({ outcome: 'unarchived' });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [patchUrl, patchInit] = fetchMock.mock.calls[1] as [
      string,
      RequestInit,
    ];
    expect(patchUrl).toBe('https://api.sanity.io/v2021-06-07/projects/proj123');
    expect(patchInit.method).toBe('PATCH');
    expect(patchInit.body).toBe(JSON.stringify({ isDisabledByUser: false }));
  });

  it('is idempotent — skips the PATCH when the project is already active', async () => {
    fetchMock.mockResolvedValueOnce(projectResponse(false));

    const result = await unarchiveSanityProject({
      token: 'mgmt-token',
      projectId: 'proj123',
    });

    expect(result).toEqual({ outcome: 'already-active' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('treats a 404 on the GET as already gone rather than an error', async () => {
    fetchMock.mockResolvedValueOnce(new Response('not found', { status: 404 }));

    const result = await unarchiveSanityProject({
      token: 'mgmt-token',
      projectId: 'proj123',
    });

    expect(result).toEqual({ outcome: 'already-gone' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws when the GET fails for a reason other than 404', async () => {
    fetchMock.mockResolvedValueOnce(new Response('forbidden', { status: 403 }));

    await expect(
      unarchiveSanityProject({ token: 'mgmt-token', projectId: 'proj123' }),
    ).rejects.toThrow(/403/);
  });

  it('throws when the PATCH fails', async () => {
    fetchMock
      .mockResolvedValueOnce(projectResponse(true))
      .mockResolvedValueOnce(new Response('server error', { status: 500 }));

    await expect(
      unarchiveSanityProject({ token: 'mgmt-token', projectId: 'proj123' }),
    ).rejects.toThrow(/500/);
  });
});

describe(createSanityRobotToken, () => {
  it('POSTs the label + role membership to the Access API and returns the minted token', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 'robot1', token: 'sk-minted' }), {
        status: 200,
      }),
    );

    const result = await createSanityRobotToken({
      token: 'tok',
      projectId: 'proj123',
      label: 'web-read',
      role: 'viewer',
    });

    expect(result).toEqual({ id: 'robot1', token: 'sk-minted' });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://api.sanity.io/v2026-07-10/access/project/proj123/robots',
    );
    expect(JSON.parse(init.body as string)).toEqual({
      label: 'web-read',
      memberships: [
        {
          resourceType: 'project',
          resourceId: 'proj123',
          roleNames: ['viewer'],
        },
      ],
    });
  });

  it('falls back to the key field when token is absent', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 'robot1', key: 'sk-legacy' }), {
        status: 200,
      }),
    );

    const result = await createSanityRobotToken({
      token: 'tok',
      projectId: 'proj123',
      label: 'web-read',
      role: 'viewer',
    });

    expect(result).toEqual({ id: 'robot1', token: 'sk-legacy' });
  });

  it('falls back to the tokenId field when id is absent', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ tokenId: 'robot1', token: 'sk-minted' }), {
        status: 200,
      }),
    );

    const result = await createSanityRobotToken({
      token: 'tok',
      projectId: 'proj123',
      label: 'web-read',
      role: 'viewer',
    });

    expect(result).toEqual({ id: 'robot1', token: 'sk-minted' });
  });

  it('throws when the response has neither a token nor key field', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 'robot1' }), { status: 200 }),
    );

    await expect(
      createSanityRobotToken({
        token: 'tok',
        projectId: 'proj123',
        label: 'x',
        role: 'viewer',
      }),
    ).rejects.toThrow(/returned no id\/token/);
  });

  it('throws when the response has neither an id nor tokenId field', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ token: 'sk-minted' }), { status: 200 }),
    );

    await expect(
      createSanityRobotToken({
        token: 'tok',
        projectId: 'proj123',
        label: 'x',
        role: 'viewer',
      }),
    ).rejects.toThrow(/returned no id\/token/);
  });
});

describe(deleteSanityRobotToken, () => {
  it('DELETEs the robot by id on the Access API and tolerates an empty response body', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(
      deleteSanityRobotToken({
        token: 'tok',
        projectId: 'proj123',
        robotId: 'robot1',
      }),
    ).resolves.toBeUndefined();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://api.sanity.io/v2026-07-10/access/project/proj123/robots/robot1',
    );
    expect(init.method).toBe('DELETE');
  });
});

describe(listSanityRobotTokens, () => {
  it('GETs the project robots endpoint and normalizes id/label from a bare array response', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify([
          { id: 'robot1', label: 'web-read (provisioned)' },
          { id: 'robot2', label: 'web-write (provisioned)' },
        ]),
        { status: 200 },
      ),
    );

    const result = await listSanityRobotTokens({
      token: 'tok',
      projectId: 'proj123',
    });

    expect(result).toEqual([
      { id: 'robot1', label: 'web-read (provisioned)' },
      { id: 'robot2', label: 'web-write (provisioned)' },
    ]);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://api.sanity.io/v2026-07-10/access/project/proj123/robots',
    );
    expect(init.method ?? 'GET').toBe('GET');
  });

  it('unwraps a `data` envelope response', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [{ id: 'robot1', label: 'web-read (provisioned)' }],
        }),
        { status: 200 },
      ),
    );

    const result = await listSanityRobotTokens({
      token: 'tok',
      projectId: 'proj123',
    });

    expect(result).toEqual([{ id: 'robot1', label: 'web-read (provisioned)' }]);
  });

  it('falls back to the tokenId field when id is absent', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify([
          { tokenId: 'robot1', label: 'web-read (provisioned)' },
        ]),
        { status: 200 },
      ),
    );

    const result = await listSanityRobotTokens({
      token: 'tok',
      projectId: 'proj123',
    });

    expect(result).toEqual([{ id: 'robot1', label: 'web-read (provisioned)' }]);
  });

  it('drops entries with no resolvable id', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify([
          { label: 'web-read (provisioned)' },
          { id: 'robot2', label: 'web-write (provisioned)' },
        ]),
        { status: 200 },
      ),
    );

    const result = await listSanityRobotTokens({
      token: 'tok',
      projectId: 'proj123',
    });

    expect(result).toEqual([
      { id: 'robot2', label: 'web-write (provisioned)' },
    ]);
  });
});
