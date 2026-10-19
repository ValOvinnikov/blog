import {
  createSanityRobotToken,
  deleteSanityRobotToken,
  listSanityRobotTokens,
} from './sanity-robot-tokens';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
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
