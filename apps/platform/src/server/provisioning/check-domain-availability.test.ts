import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';

import { checkDomainAvailability } from './check-domain-availability';

vi.mock('@platform/utils/env/env');

const envMock: Partial<Record<keyof typeof env, string>> = env;

vi.mock('@platform/utils/logger/logger');

const loggerErrorMock = vi.mocked(logger.error);

describe(checkDomainAvailability, () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    loggerErrorMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    envMock.VERCEL_API_TOKEN = 'vercel-token';
    envMock.VERCEL_PROJECT_ID_WEB = 'prj_web';
    envMock.VERCEL_TEAM_ID = undefined;
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ projectDomains: [] }), { status: 200 }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns NOT_CONFIGURED with no request when the Vercel token or project is unset', async () => {
    envMock.VERCEL_API_TOKEN = undefined;
    envMock.VERCEL_PROJECT_ID_WEB = undefined;

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

  it('returns AVAILABLE when the domain is attached only to the shared web project', async () => {
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

  it('requests the apex domain and matches the full domain in the response', async () => {
    await checkDomainAvailability('blog-dev.valstack.dev');

    const [calledUrl] = fetchMock.mock.calls[0] as [URL];
    expect(calledUrl.pathname).toBe('/v1/domains/valstack.dev/project-domains');
  });

  it('requests the registrable domain under a multi-part public suffix', async () => {
    await checkDomainAvailability('blog.example.co.uk');

    const [calledUrl] = fetchMock.mock.calls[0] as [URL];
    expect(calledUrl.pathname).toBe(
      '/v1/domains/example.co.uk/project-domains',
    );
  });

  it('returns ERROR with no request, and logs, when the apex domain is undeterminable', async () => {
    const result = await checkDomainAvailability('co.uk');

    expect(result).toBe('ERROR');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'tenants.domain_availability_apex_undetermined',
      { domain: 'co.uk' },
    );
  });

  it('returns ERROR with no request for an IP-literal host', async () => {
    const result = await checkDomainAvailability('1.2.3.4');

    expect(result).toBe('ERROR');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'tenants.domain_availability_apex_undetermined',
      { domain: '1.2.3.4' },
    );
  });

  it('returns IN_USE for a subdomain attached to another project under the same apex', async () => {
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

  it('returns AVAILABLE for a subdomain already attached to the shared web project', async () => {
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

  it('returns AVAILABLE when no returned project domain is the exact requested name', async () => {
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

  it('follows the pagination cursor to a conflict that only appears on a later page', async () => {
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

  it('returns ERROR, not a false AVAILABLE, when the page cap runs out inconclusively', async () => {
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
