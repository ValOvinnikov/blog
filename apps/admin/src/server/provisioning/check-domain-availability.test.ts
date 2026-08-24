import { checkDomainAvailability } from './check-domain-availability';

const { envMock } = vi.hoisted(() => ({
  envMock: {
    VERCEL_API_TOKEN: undefined as string | undefined,
    VERCEL_WEB_PROJECT_ID: undefined as string | undefined,
    VERCEL_TEAM_ID: undefined as string | undefined,
  },
}));

vi.mock('@admin/utils/env/env', () => ({ env: envMock }));

describe(checkDomainAvailability, () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    envMock.VERCEL_API_TOKEN = 'vercel-token';
    envMock.VERCEL_WEB_PROJECT_ID = 'prj_web';
    envMock.VERCEL_TEAM_ID = undefined;
  });

  it('returns NOT_CONFIGURED when the Vercel token or project id is missing, and makes no request', async () => {
    envMock.VERCEL_API_TOKEN = undefined;
    envMock.VERCEL_WEB_PROJECT_ID = undefined;

    const result = await checkDomainAvailability('example.com');

    expect(result).toBe('NOT_CONFIGURED');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a domain containing path-traversal characters without making a request', async () => {
    const result = await checkDomainAvailability('../../v1/domains/other');

    expect(result).toBe('ERROR');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns AVAILABLE for a 404 response (domain unknown to the team)', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }));

    const result = await checkDomainAvailability('example.com');

    expect(result).toBe('AVAILABLE');
  });

  it('returns AVAILABLE when the domain is attached only to the shared web project (own, on retry)', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          projectDomains: [{ name: 'example.com', projectId: 'prj_web' }],
        }),
        { status: 200 },
      ),
    );

    const result = await checkDomainAvailability('example.com');

    expect(result).toBe('AVAILABLE');
  });

  it('returns IN_USE when the domain is attached to a different project', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          projectDomains: [{ name: 'example.com', projectId: 'prj_other' }],
        }),
        { status: 200 },
      ),
    );

    const result = await checkDomainAvailability('example.com');

    expect(result).toBe('IN_USE');
  });

  it('matches the response name case-insensitively and ignoring a trailing dot', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          projectDomains: [{ name: 'Example.com.', projectId: 'prj_other' }],
        }),
        { status: 200 },
      ),
    );

    const result = await checkDomainAvailability('example.com');

    expect(result).toBe('IN_USE');
  });

  it('requests the apex domain, not the full subdomain, and matches the full domain in the response', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ projectDomains: [] }), { status: 200 }),
    );

    await checkDomainAvailability('blog-dev.valstack.dev');

    const [calledUrl] = fetchMock.mock.calls[0] as [URL];
    expect(calledUrl.pathname).toBe('/v1/domains/valstack.dev/project-domains');
  });

  it('returns IN_USE for a subdomain attached to a different project under the same apex, requested against the apex', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          projectDomains: [
            { name: 'blog-dev.valstack.dev', projectId: 'prj_other' },
            { name: 'other-tenant.valstack.dev', projectId: 'prj_unrelated' },
          ],
        }),
        { status: 200 },
      ),
    );

    const result = await checkDomainAvailability('blog-dev.valstack.dev');

    expect(result).toBe('IN_USE');
    const [calledUrl] = fetchMock.mock.calls[0] as [URL];
    expect(calledUrl.pathname).toBe('/v1/domains/valstack.dev/project-domains');
  });

  it('returns AVAILABLE for a subdomain already attached to the shared web project (own, on retry), requested against the apex', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          projectDomains: [
            { name: 'blog-dev.valstack.dev', projectId: 'prj_web' },
          ],
        }),
        { status: 200 },
      ),
    );

    const result = await checkDomainAvailability('blog-dev.valstack.dev');

    expect(result).toBe('AVAILABLE');
    const [calledUrl] = fetchMock.mock.calls[0] as [URL];
    expect(calledUrl.pathname).toBe('/v1/domains/valstack.dev/project-domains');
  });

  it('returns AVAILABLE when returned project domains do not include the exact requested name', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          projectDomains: [
            { name: 'other.example.com', projectId: 'prj_other' },
          ],
        }),
        { status: 200 },
      ),
    );

    const result = await checkDomainAvailability('example.com');

    expect(result).toBe('AVAILABLE');
  });

  it('follows the pagination cursor and finds a conflict that only appears on a later page', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            projectDomains: [
              {
                name: 'someone-else.valstack.dev',
                projectId: 'prj_unrelated',
              },
            ],
            pagination: { count: 1, next: 1700000000000, prev: null },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            projectDomains: [
              { name: 'blog-dev.valstack.dev', projectId: 'prj_other' },
            ],
            pagination: { count: 1, next: null, prev: null },
          }),
          { status: 200 },
        ),
      );

    const result = await checkDomainAvailability('blog-dev.valstack.dev');

    expect(result).toBe('IN_USE');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const secondCall = fetchMock.mock.calls[1];
    const secondCalledUrl = secondCall?.[0] as URL;
    expect(secondCalledUrl.searchParams.get('until')).toBe('1700000000000');
  });

  it('stops requesting further pages once a conflict is found on an earlier page', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          projectDomains: [
            { name: 'blog-dev.valstack.dev', projectId: 'prj_other' },
          ],
          pagination: { count: 1, next: 1700000000000, prev: null },
        }),
        { status: 200 },
      ),
    );

    const result = await checkDomainAvailability('blog-dev.valstack.dev');

    expect(result).toBe('IN_USE');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns ERROR without a false AVAILABLE when the page cap is exhausted without a conclusive answer', async () => {
    // A fresh Response per call — reusing one instance across calls throws
    // on the second `.json()` read and would mask the real exhaustion path
    // behind the network-error branch instead.
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            projectDomains: [
              {
                name: 'someone-else.valstack.dev',
                projectId: 'prj_unrelated',
              },
            ],
            pagination: { count: 1, next: 1700000000000, prev: null },
          }),
          { status: 200 },
        ),
      ),
    );

    const result = await checkDomainAvailability('blog-dev.valstack.dev');

    expect(result).toBe('ERROR');
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it('returns ERROR for an unexpected non-2xx response', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));

    const result = await checkDomainAvailability('example.com');

    expect(result).toBe('ERROR');
  });

  it('returns ERROR when the request throws or times out', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));

    const result = await checkDomainAvailability('example.com');

    expect(result).toBe('ERROR');
  });
});
