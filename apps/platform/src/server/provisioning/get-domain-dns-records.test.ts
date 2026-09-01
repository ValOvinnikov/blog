import { getDomainDnsRecords } from './get-domain-dns-records';

const { envMock } = vi.hoisted(() => ({
  envMock: {
    VERCEL_API_TOKEN: undefined as string | undefined,
    VERCEL_PROJECT_ID_WEB: undefined as string | undefined,
    VERCEL_TEAM_ID: undefined as string | undefined,
  },
}));

vi.mock('@platform/utils/env/env', () => ({ env: envMock }));

describe(getDomainDnsRecords, () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    envMock.VERCEL_API_TOKEN = 'vercel-token';
    envMock.VERCEL_PROJECT_ID_WEB = 'prj_123';
    envMock.VERCEL_TEAM_ID = undefined;
  });

  it('returns undefined when the Vercel token or project id is missing', async () => {
    envMock.VERCEL_API_TOKEN = undefined;
    envMock.VERCEL_PROJECT_ID_WEB = undefined;

    const result = await getDomainDnsRecords('example.com');

    expect(result).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a domain containing path-traversal characters without making a request', async () => {
    const result = await getDomainDnsRecords('../../v9/projects/other');

    expect(result).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns undefined for a 404 response (domain not yet added)', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }));

    const result = await getDomainDnsRecords('example.com');

    expect(result).toBeUndefined();
  });

  it('returns undefined for an unexpected non-2xx response', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));

    const result = await getDomainDnsRecords('example.com');

    expect(result).toBeUndefined();
  });

  it('returns undefined when the request throws', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));

    const result = await getDomainDnsRecords('example.com');

    expect(result).toBeUndefined();
  });

  it('returns undefined when the domain is already verified, even if Vercel still lists challenges', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          verified: true,
          verification: [
            { type: 'TXT', domain: '_vercel.example.com', value: 'abc' },
          ],
        }),
        { status: 200 },
      ),
    );

    const result = await getDomainDnsRecords('example.com');

    expect(result).toBeUndefined();
  });

  it('maps the verification challenges to type/name/value records when pending', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
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
        { status: 200 },
      ),
    );

    const result = await getDomainDnsRecords('example.com');

    expect(result).toEqual([
      {
        type: 'TXT',
        name: '_vercel.example.com',
        value: 'vc-domain-verify=example.com,abc123',
      },
    ]);
  });

  it('returns an empty array when pending with no verification challenges reported', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ verified: false }), { status: 200 }),
    );

    const result = await getDomainDnsRecords('example.com');

    expect(result).toEqual([]);
  });
});
