import { createSanityWebhook, listSanityWebhooks } from './sanity-webhooks';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(listSanityWebhooks, () => {
  it('GETs the global hooks endpoint without following redirects', async () => {
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
      'https://api.sanity.io/v2025-08-04/hooks/projects/proj123',
    );
    expect(init.method ?? 'GET').toBe('GET');
    expect(init.redirect).toBe('error');
  });

  it('explains project membership when the management token is unauthorized', async () => {
    fetchMock.mockResolvedValue(new Response('Unauthorized', { status: 401 }));

    await expect(
      listSanityWebhooks({ token: 'tok', projectId: 'proj123' }),
    ).rejects.toThrow(/401 .*not a member of project "proj123"/);
  });
});

describe(createSanityWebhook, () => {
  const input = {
    token: 'tok',
    projectId: 'proj123',
    dataset: 'production',
    name: 'web-revalidate',
    url: 'https://web.example.com/api/revalidate',
    secret: 'shh',
  };

  it('POSTs a document webhook for create, update and delete events', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'hook1',
          url: 'https://web.example.com/api/revalidate',
        }),
        { status: 200 },
      ),
    );

    const result = await createSanityWebhook(input);

    expect(result).toEqual({
      id: 'hook1',
      url: 'https://web.example.com/api/revalidate',
    });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://api.sanity.io/v2025-08-04/hooks/projects/proj123',
    );
    expect(init.method).toBe('POST');
    expect(init.redirect).toBe('error');
    expect(JSON.parse(init.body as string)).toEqual({
      type: 'document',
      name: 'web-revalidate',
      dataset: 'production',
      url: 'https://web.example.com/api/revalidate',
      apiVersion: 'v2021-06-07',
      httpMethod: 'POST',
      includeDrafts: false,
      rule: {
        on: ['create', 'update', 'delete'],
        projection: '{_type, _id, "slug": slug.current}',
      },
      secret: 'shh',
    });
  });

  it('throws naming the project when the response is a hook list', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 }),
    );

    await expect(createSanityWebhook(input)).rejects.toThrow(/proj123/);
  });

  it('throws when the created hook targets a different URL', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ id: 'hook1', url: 'https://other.example.com' }),
        { status: 200 },
      ),
    );

    await expect(createSanityWebhook(input)).rejects.toThrow(/proj123/);
  });

  it('throws when the response body is empty', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 201 }));

    await expect(createSanityWebhook(input)).rejects.toThrow(/proj123/);
  });

  it('throws with the response status and body on failure', async () => {
    fetchMock.mockResolvedValue(new Response('nope', { status: 402 }));

    await expect(createSanityWebhook(input)).rejects.toThrow(/402/);
  });
});
