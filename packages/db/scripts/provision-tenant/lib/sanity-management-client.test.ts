import {
  addSanityCorsOrigin,
  createSanityDataset,
  createSanityProject,
  createSanityProjectInvite,
  createSanityWebhook,
  grantSanityProjectRole,
  listSanityCorsOrigins,
  listSanityDatasets,
  listSanityProjectAcl,
  listSanityProjectInvites,
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
  });
});

describe(addSanityCorsOrigin, () => {
  it('POSTs to the corrected /projects/:id/cors path with credentials allowed', async () => {
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

describe(listSanityProjectInvites, () => {
  it('GETs the project-scoped invites endpoint filtered to pending and accepted, unwrapping the documented `data` envelope', async () => {
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
  it('PUTs the roleName to the project-scoped acl endpoint against v2021-06-07, keyed on projectUserId', async () => {
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
