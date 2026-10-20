import {
  addSanityCorsOrigin,
  createSanityDataset,
  createSanityProject,
  listSanityCorsOrigins,
  listSanityDatasets,
} from './sanity-project-setup';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(createSanityProject, () => {
  it('POSTs to /projects with the display name and organization id', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 'proj123' }), { status: 200 }),
    );

    const result = await createSanityProject({
      token: 'tok',
      displayName: 'Acme',
      organizationId: 'org-abc',
    });

    expect(result).toEqual({ id: 'proj123' });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.sanity.io/v2021-06-07/projects');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      displayName: 'Acme',
      organizationId: 'org-abc',
    });
    expect((init.headers as Record<string, string>)['Authorization']).toBe(
      'Bearer tok',
    );
  });

  it('throws with the response status and body on failure', async () => {
    fetchMock.mockResolvedValue(new Response('nope', { status: 402 }));

    await expect(
      createSanityProject({
        token: 'tok',
        displayName: 'Acme',
        organizationId: 'org-abc',
      }),
    ).rejects.toThrow(/402/);
  });

  it('sends an abort signal so a hung call fails instead of stalling the run', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 'proj123' }), { status: 200 }),
    );

    await createSanityProject({
      token: 'tok',
      displayName: 'Acme',
      organizationId: 'org-abc',
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.signal).toBeInstanceOf(AbortSignal);
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

describe(listSanityDatasets, () => {
  it('GETs the project-scoped datasets endpoint and returns the list', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify([{ name: 'production' }]), {
        status: 200,
      }),
    );

    const result = await listSanityDatasets({
      token: 'tok',
      projectId: 'proj123',
    });

    expect(result).toEqual([{ name: 'production' }]);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://api.sanity.io/v2021-06-07/projects/proj123/datasets',
    );
    expect(init.method ?? 'GET').toBe('GET');
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
});

describe(addSanityCorsOrigin, () => {
  it('POSTs to /projects/:id/cors with credentials allowed', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

    await addSanityCorsOrigin({
      token: 'tok',
      projectId: 'proj123',
      origin: 'https://admin.example.com',
      allowCredentials: true,
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.sanity.io/v2021-06-07/projects/proj123/cors');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      origin: 'https://admin.example.com',
      allowCredentials: true,
    });
  });
});

describe(listSanityCorsOrigins, () => {
  it('GETs the project-scoped cors endpoint and returns the list', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify([{ id: 'cors1', origin: 'https://admin.example.com' }]),
        { status: 200 },
      ),
    );

    const result = await listSanityCorsOrigins({
      token: 'tok',
      projectId: 'proj123',
    });

    expect(result).toEqual([
      { id: 'cors1', origin: 'https://admin.example.com' },
    ]);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.sanity.io/v2021-06-07/projects/proj123/cors');
    expect(init.method ?? 'GET').toBe('GET');
  });
});
