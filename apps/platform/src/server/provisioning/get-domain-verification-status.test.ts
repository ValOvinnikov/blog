import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import { env } from '@platform/utils/env/env';

import { getDomainVerificationStatus } from './get-domain-verification-status';

vi.mock('@platform/utils/env/env');

const envMock: Partial<Record<keyof typeof env, string>> = env;

describe(getDomainVerificationStatus, () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    envMock.VERCEL_API_TOKEN = 'vercel-token';
    envMock.VERCEL_PROJECT_ID_WEB = 'prj_123';
    envMock.VERCEL_TEAM_ID = undefined;
  });

  it('returns NOT_CONFIGURED when the Vercel token or project id is missing', async () => {
    envMock.VERCEL_API_TOKEN = undefined;
    envMock.VERCEL_PROJECT_ID_WEB = undefined;

    const result = await getDomainVerificationStatus('example.com');

    expect(result).toBe(DOMAIN_VERIFICATION_STATUS.NOT_CONFIGURED);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a domain containing path-traversal characters without making a request', async () => {
    const result = await getDomainVerificationStatus('../../v9/projects/other');

    expect(result).toBe(DOMAIN_VERIFICATION_STATUS.ERROR);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('percent-encodes the domain when building the Vercel request URL', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ verified: true }), { status: 200 }),
    );

    await getDomainVerificationStatus('example.com');

    const [calledUrl] = fetchMock.mock.calls[0] as [URL];
    expect(calledUrl.pathname).toBe('/v9/projects/prj_123/domains/example.com');
  });

  it('returns NOT_ADDED for a 404 response', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }));

    const result = await getDomainVerificationStatus('example.com');

    expect(result).toBe(DOMAIN_VERIFICATION_STATUS.NOT_ADDED);
  });

  it('returns VERIFIED when the API reports verified: true', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ verified: true }), { status: 200 }),
    );

    const result = await getDomainVerificationStatus('example.com');

    expect(result).toBe(DOMAIN_VERIFICATION_STATUS.VERIFIED);
  });

  it('returns PENDING when the API reports verified: false', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ verified: false }), { status: 200 }),
    );

    const result = await getDomainVerificationStatus('example.com');

    expect(result).toBe(DOMAIN_VERIFICATION_STATUS.PENDING);
  });

  it('returns ERROR for an unexpected non-2xx response', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));

    const result = await getDomainVerificationStatus('example.com');

    expect(result).toBe(DOMAIN_VERIFICATION_STATUS.ERROR);
  });

  it('returns ERROR when the request throws', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));

    const result = await getDomainVerificationStatus('example.com');

    expect(result).toBe(DOMAIN_VERIFICATION_STATUS.ERROR);
  });
});
