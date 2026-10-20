import {
  createSanityProjectInvite,
  grantSanityProjectRole,
  listSanityProjectAcl,
  listSanityProjectInvites,
} from './sanity-project-access';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(listSanityProjectInvites, () => {
  it('GETs pending and accepted invites, unwrapping the `data` envelope', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [{ email: 'owner@example.com', status: 'pending' }],
          nextCursor: null,
        }),
        { status: 200 },
      ),
    );

    const result = await listSanityProjectInvites({
      token: 'tok',
      projectId: 'proj123',
    });

    expect(result).toEqual([{ email: 'owner@example.com', status: 'pending' }]);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://api.sanity.io/v2026-07-10/access/project/proj123/invites?status=pending&status=accepted',
    );
    expect(init.method ?? 'GET').toBe('GET');
  });

  it('accepts a bare array response with no envelope', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify([{ email: 'owner@example.com', status: 'accepted' }]),
        { status: 200 },
      ),
    );

    const result = await listSanityProjectInvites({
      token: 'tok',
      projectId: 'proj123',
    });

    expect(result).toEqual([
      { email: 'owner@example.com', status: 'accepted' },
    ]);
  });
});

describe(createSanityProjectInvite, () => {
  it('POSTs the email + role to the project-scoped invites endpoint', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 'invite1', status: 'pending' }), {
        status: 200,
      }),
    );

    await createSanityProjectInvite({
      token: 'tok',
      projectId: 'proj123',
      email: 'owner@example.com',
      role: 'editor',
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://api.sanity.io/v2026-07-10/access/project/proj123/invites',
    );
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      email: 'owner@example.com',
      role: 'editor',
    });
  });

  it('throws with the response status and body on failure', async () => {
    fetchMock.mockResolvedValue(new Response('nope', { status: 402 }));

    await expect(
      createSanityProjectInvite({
        token: 'tok',
        projectId: 'proj123',
        email: 'owner@example.com',
        role: 'editor',
      }),
    ).rejects.toThrow(/402/);
  });
});

describe(listSanityProjectAcl, () => {
  it('GETs the project-scoped acl endpoint and returns the list', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            projectUserId: 'p123',
            roles: [{ name: 'viewer' }],
            isRobot: false,
          },
        ]),
        { status: 200 },
      ),
    );

    const result = await listSanityProjectAcl({
      token: 'tok',
      projectId: 'proj123',
    });

    expect(result).toEqual([
      { projectUserId: 'p123', roles: [{ name: 'viewer' }], isRobot: false },
    ]);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.sanity.io/v2021-06-07/projects/proj123/acl/');
    expect(init.method ?? 'GET').toBe('GET');
  });

  it('throws with the response status and body on failure', async () => {
    fetchMock.mockResolvedValue(new Response('nope', { status: 403 }));

    await expect(
      listSanityProjectAcl({ token: 'tok', projectId: 'proj123' }),
    ).rejects.toThrow(/403/);
  });
});

describe(grantSanityProjectRole, () => {
  it('PUTs the roleName to the legacy acl endpoint keyed on projectUserId', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ projectUserId: 'p123' }), {
        status: 201,
      }),
    );

    await grantSanityProjectRole({
      token: 'tok',
      projectId: 'proj123',
      projectUserId: 'p123',
      role: 'administrator',
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://api.sanity.io/v2021-06-07/projects/proj123/acl/p123',
    );
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body as string)).toEqual({
      roleName: 'administrator',
    });
  });

  it('throws with the response status and body on failure', async () => {
    fetchMock.mockResolvedValue(new Response('nope', { status: 403 }));

    await expect(
      grantSanityProjectRole({
        token: 'tok',
        projectId: 'proj123',
        projectUserId: 'p123',
        role: 'administrator',
      }),
    ).rejects.toThrow(/403/);
  });
});
