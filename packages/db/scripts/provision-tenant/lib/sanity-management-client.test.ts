import {
  addSanityCorsOrigin,
  createSanityDataset,
  createSanityProject,
  createSanityRobotToken,
  createSanityWebhook,
  deleteSanityRobotToken,
  listSanityWebhooks,
} from './sanity-management-client';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(createSanityProject, () => {
  it('POSTs to /projects with the display name', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 'proj123' }), { status: 200 }),
    );

    const result = await createSanityProject({
      token: 'tok',
      displayName: 'Acme',
    });

    expect(result).toEqual({ id: 'proj123' });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.sanity.io/v2021-06-07/projects');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ displayName: 'Acme' });
    expect((init.headers as Record<string, string>)['Authorization']).toBe(
      'Bearer tok',
    );
  });

  it('throws with the response status and body on failure', async () => {
    fetchMock.mockResolvedValue(new Response('nope', { status: 402 }));

    await expect(
      createSanityProject({ token: 'tok', displayName: 'Acme' }),
    ).rejects.toThrow(/402/);
  });
});

describe(createSanityDataset, () => {
  it('PUTs the dataset with a public aclMode', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

    await createSanityDataset({
      token: 'tok',
      projectId: 'proj123',
      dataset: 'production',
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://api.sanity.io/v2021-06-07/projects/proj123/datasets/production',
    );
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body as string)).toEqual({ aclMode: 'public' });
  });
});

describe(addSanityCorsOrigin, () => {
  it('POSTs the origin with credentials allowed', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

    await addSanityCorsOrigin({
      token: 'tok',
      projectId: 'proj123',
      origin: 'https://admin.example.com',
      allowCredentials: true,
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://api.sanity.io/v2021-06-07/projects/proj123/cors-origins',
    );
    expect(JSON.parse(init.body as string)).toEqual({
      origin: 'https://admin.example.com',
      allowCredentials: true,
    });
  });
});

describe(createSanityRobotToken, () => {
  it('POSTs the label + role and returns the minted token', async () => {
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
      'https://api.sanity.io/v2021-06-07/projects/proj123/robots',
    );
    expect(JSON.parse(init.body as string)).toEqual({
      label: 'web-read',
      role: 'viewer',
    });
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
    ).rejects.toThrow(/returned no token/);
  });
});

describe(deleteSanityRobotToken, () => {
  it('DELETEs the robot by id and tolerates an empty response body', async () => {
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
      'https://api.sanity.io/v2021-06-07/projects/proj123/robots/robot1',
    );
    expect(init.method).toBe('DELETE');
  });
});

describe(listSanityWebhooks, () => {
  it('GETs the project-scoped hooks endpoint and returns the list', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify([
          { id: 'hook1', url: 'https://web.example.com/api/revalidate' },
        ]),
        { status: 200 },
      ),
    );

    const result = await listSanityWebhooks({
      token: 'tok',
      projectId: 'proj123',
    });

    expect(result).toEqual([
      { id: 'hook1', url: 'https://web.example.com/api/revalidate' },
    ]);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://proj123.api.sanity.io/v2021-06-07/hooks/projects/proj123',
    );
    expect(init.method ?? 'GET').toBe('GET');
  });
});

describe(createSanityWebhook, () => {
  it('POSTs a document webhook to the project-scoped hooks endpoint', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'hook1',
          url: 'https://web.example.com/api/revalidate',
        }),
        { status: 200 },
      ),
    );

    const result = await createSanityWebhook({
      token: 'tok',
      projectId: 'proj123',
      dataset: 'production',
      name: 'web-revalidate',
      url: 'https://web.example.com/api/revalidate',
      secret: 'shh',
    });

    expect(result).toEqual({
      id: 'hook1',
      url: 'https://web.example.com/api/revalidate',
    });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://proj123.api.sanity.io/v2021-06-07/hooks/projects/proj123',
    );
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      type: 'document',
      name: 'web-revalidate',
      dataset: 'production',
      url: 'https://web.example.com/api/revalidate',
      apiVersion: 'v2021-06-07',
      httpMethod: 'POST',
      secret: 'shh',
    });
  });

  it('throws with the response status and body on failure', async () => {
    fetchMock.mockResolvedValue(new Response('nope', { status: 402 }));

    await expect(
      createSanityWebhook({
        token: 'tok',
        projectId: 'proj123',
        dataset: 'production',
        name: 'web-revalidate',
        url: 'https://web.example.com/api/revalidate',
        secret: 'shh',
      }),
    ).rejects.toThrow(/402/);
  });
});
