import { getDomainVerificationStatus } from './get-domain-verification-status';

const { envMock } = vi.hoisted(() => ({
  envMock: {
    VERCEL_API_TOKEN: undefined as string | undefined,
    VERCEL_WEB_PROJECT_ID: undefined as string | undefined,
    VERCEL_TEAM_ID: undefined as string | undefined,
  },
}));

vi.mock('@admin/utils/env/env', () => ({ env: envMock }));

describe(getDomainVerificationStatus, () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    envMock.VERCEL_API_TOKEN = 'vercel-token';
    envMock.VERCEL_WEB_PROJECT_ID = 'prj_123';
    envMock.VERCEL_TEAM_ID = undefined;
  });

  it('returns NOT_CONFIGURED when the Vercel token or project id is missing', async () => {
    envMock.VERCEL_API_TOKEN = undefined;
    envMock.VERCEL_WEB_PROJECT_ID = undefined;

    const result = await getDomainVerificationStatus('example.com');

    expect(result).toBe('NOT_CONFIGURED');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns NOT_ADDED for a 404 response', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }));

    const result = await getDomainVerificationStatus('example.com');

    expect(result).toBe('NOT_ADDED');
  });

  it('returns VERIFIED when the API reports verified: true', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ verified: true }), { status: 200 }),
    );

    const result = await getDomainVerificationStatus('example.com');

    expect(result).toBe('VERIFIED');
  });

  it('returns PENDING when the API reports verified: false', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ verified: false }), { status: 200 }),
    );

    const result = await getDomainVerificationStatus('example.com');

    expect(result).toBe('PENDING');
  });

  it('returns ERROR for an unexpected non-2xx response', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));

    const result = await getDomainVerificationStatus('example.com');

    expect(result).toBe('ERROR');
  });

  it('returns ERROR when the request throws', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));

    const result = await getDomainVerificationStatus('example.com');

    expect(result).toBe('ERROR');
  });
});
