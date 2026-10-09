import { DOMAIN_VERIFICATION_STATUS } from '@blog/config';
import { env } from '@platform/utils/env/env';

import { getProjectDomain } from './vercel-domains-api';

vi.mock('@platform/utils/env/env');

const envMock: Partial<Record<keyof typeof env, string>> = env;

const respondWith = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200 });

describe(getProjectDomain, () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    envMock.VERCEL_API_TOKEN = 'vercel-token';
    envMock.VERCEL_PROJECT_ID_WEB = 'prj_123';
    envMock.VERCEL_TEAM_ID = undefined;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('makes exactly one authenticated request scoped to the team', async () => {
    envMock.VERCEL_TEAM_ID = 'team_1';
    fetchMock.mockResolvedValue(respondWith({ verified: false }));

    await getProjectDomain('example.com');

    expect(fetchMock).toHaveBeenCalledOnce();
    const [calledUrl, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(calledUrl.pathname).toBe('/v9/projects/prj_123/domains/example.com');
    expect(calledUrl.searchParams.get('teamId')).toBe('team_1');
    expect(init.headers).toEqual({ Authorization: 'Bearer vercel-token' });
  });

  it('returns NOT_CONFIGURED with no records and no request when Vercel is unset', async () => {
    envMock.VERCEL_API_TOKEN = undefined;

    const result = await getProjectDomain('example.com');

    expect(result).toEqual({
      status: DOMAIN_VERIFICATION_STATUS.NOT_CONFIGURED,
      dnsRecords: [],
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns NOT_ADDED with no records for a 404 response', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }));

    const result = await getProjectDomain('example.com');

    expect(result).toEqual({
      status: DOMAIN_VERIFICATION_STATUS.NOT_ADDED,
      dnsRecords: [],
    });
  });

  it('returns ERROR with no records when the request throws', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));

    const result = await getProjectDomain('example.com');

    expect(result).toEqual({
      status: DOMAIN_VERIFICATION_STATUS.ERROR,
      dnsRecords: [],
    });
  });

  it('returns VERIFIED with no records even if Vercel still lists challenges', async () => {
    fetchMock.mockResolvedValue(
      respondWith({
        verified: true,
        verification: [
          { type: 'TXT', domain: '_vercel.example.com', value: 'abc' },
        ],
      }),
    );

    const result = await getProjectDomain('example.com');

    expect(result).toEqual({
      status: DOMAIN_VERIFICATION_STATUS.VERIFIED,
      dnsRecords: [],
    });
  });

  it('returns PENDING with the verification challenges as type/name/value records', async () => {
    fetchMock.mockResolvedValue(
      respondWith({
        verified: false,
        verification: [
          {
            type: 'TXT',
            domain: '_vercel.example.com',
            value: 'vc-domain-verify=example.com,abc123',
            reason: 'pending_domain',
          },
        ],
      }),
    );

    const result = await getProjectDomain('example.com');

    expect(result).toEqual({
      status: DOMAIN_VERIFICATION_STATUS.PENDING,
      dnsRecords: [
        {
          type: 'TXT',
          name: '_vercel.example.com',
          value: 'vc-domain-verify=example.com,abc123',
        },
      ],
    });
  });

  it('returns PENDING with no records when Vercel reports no challenges', async () => {
    fetchMock.mockResolvedValue(respondWith({ verified: false }));

    const result = await getProjectDomain('example.com');

    expect(result).toEqual({
      status: DOMAIN_VERIFICATION_STATUS.PENDING,
      dnsRecords: [],
    });
  });
});
