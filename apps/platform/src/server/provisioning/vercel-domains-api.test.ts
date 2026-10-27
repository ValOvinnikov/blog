import { HTTP_STATUS } from '@blog/config';
import { faker } from '@faker-js/faker';
import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import { PROVISIONING_LOG } from '@platform/constants/provisioning';
import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';

import { getProjectDomain } from './vercel-domains-api';

vi.mock('@platform/utils/env/env');

faker.seed(5997);

const envMock: Partial<Record<keyof typeof env, string>> = env;

const loggerErrorMock = vi.mocked(logger.error);
const fetchMock = vi.fn();

const MOCK_VERCEL_TOKEN = faker.string.alphanumeric(24);
const MOCK_PROJECT_ID = `prj_${faker.string.alphanumeric(12)}`;
const MOCK_TEAM_ID = `team_${faker.string.alphanumeric(12)}`;
const MOCK_DOMAIN = faker.internet.domainName();
const MOCK_CHALLENGE_NAME = `_vercel.${MOCK_DOMAIN}`;
const MOCK_CHALLENGE_VALUE = `vc-domain-verify=${MOCK_DOMAIN},${faker.string.alphanumeric(6)}`;
const MOCK_TRAVERSAL_DOMAIN = '../../v9/projects/other';
const MOCK_NETWORK_ERROR_MESSAGE = faker.lorem.words(2);
const DNS_RECORD_TYPE_TXT = 'TXT';

const respondWith = (body: unknown, status: number = HTTP_STATUS.OK) =>
  new Response(JSON.stringify(body), { status });

describe(getProjectDomain, () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    envMock.VERCEL_API_TOKEN = MOCK_VERCEL_TOKEN;
    envMock.VERCEL_PROJECT_ID_WEB = MOCK_PROJECT_ID;
    envMock.VERCEL_TEAM_ID = undefined;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('makes exactly one authenticated request scoped to the team', async () => {
    envMock.VERCEL_TEAM_ID = MOCK_TEAM_ID;
    fetchMock.mockResolvedValue(respondWith({ verified: false }));

    await getProjectDomain(MOCK_DOMAIN);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [calledUrl, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(calledUrl.pathname).toBe(
      `/v9/projects/${MOCK_PROJECT_ID}/domains/${MOCK_DOMAIN}`,
    );
    expect(calledUrl.searchParams.get('teamId')).toBe(MOCK_TEAM_ID);
    expect(init.headers).toEqual({
      Authorization: `Bearer ${MOCK_VERCEL_TOKEN}`,
    });
  });

  it('returns NOT_CONFIGURED with no records and no request when Vercel is unset', async () => {
    envMock.VERCEL_API_TOKEN = undefined;

    const result = await getProjectDomain(MOCK_DOMAIN);

    expect(result).toEqual({
      status: DOMAIN_VERIFICATION_STATUS.NOT_CONFIGURED,
      dnsRecords: [],
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns ERROR, logs and makes no request for a path-traversal domain', async () => {
    const result = await getProjectDomain(MOCK_TRAVERSAL_DOMAIN);

    expect(result).toEqual({
      status: DOMAIN_VERIFICATION_STATUS.ERROR,
      dnsRecords: [],
    });
    expect(loggerErrorMock).toHaveBeenCalledWith(
      PROVISIONING_LOG.DOMAIN_CHECK_INVALID_DOMAIN,
      { domain: MOCK_TRAVERSAL_DOMAIN },
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns NOT_ADDED with no records for a 404 response', async () => {
    fetchMock.mockResolvedValue(respondWith(null, HTTP_STATUS.NOT_FOUND));

    const result = await getProjectDomain(MOCK_DOMAIN);

    expect(result).toEqual({
      status: DOMAIN_VERIFICATION_STATUS.NOT_ADDED,
      dnsRecords: [],
    });
  });

  it('returns ERROR with no records for an unexpected non-2xx response', async () => {
    fetchMock.mockResolvedValue(
      respondWith(null, HTTP_STATUS.INTERNAL_SERVER_ERROR),
    );

    const result = await getProjectDomain(MOCK_DOMAIN);

    expect(result).toEqual({
      status: DOMAIN_VERIFICATION_STATUS.ERROR,
      dnsRecords: [],
    });
    expect(loggerErrorMock).toHaveBeenCalledWith(
      PROVISIONING_LOG.DOMAIN_CHECK_FAILED,
      {
        domain: MOCK_DOMAIN,
        responseStatus: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      },
    );
  });

  it('returns ERROR with no records when the request throws', async () => {
    const error = new Error(MOCK_NETWORK_ERROR_MESSAGE);
    fetchMock.mockRejectedValue(error);

    const result = await getProjectDomain(MOCK_DOMAIN);

    expect(result).toEqual({
      status: DOMAIN_VERIFICATION_STATUS.ERROR,
      dnsRecords: [],
    });
    expect(loggerErrorMock).toHaveBeenCalledWith(
      PROVISIONING_LOG.DOMAIN_CHECK_ERROR,
      { domain: MOCK_DOMAIN, errorName: error.name },
    );
  });

  it('returns VERIFIED with no records even if Vercel still lists challenges', async () => {
    fetchMock.mockResolvedValue(
      respondWith({
        verified: true,
        verification: [
          {
            type: DNS_RECORD_TYPE_TXT,
            domain: MOCK_CHALLENGE_NAME,
            value: MOCK_CHALLENGE_VALUE,
          },
        ],
      }),
    );

    const result = await getProjectDomain(MOCK_DOMAIN);

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
            type: DNS_RECORD_TYPE_TXT,
            domain: MOCK_CHALLENGE_NAME,
            value: MOCK_CHALLENGE_VALUE,
            reason: 'pending_domain',
          },
        ],
      }),
    );

    const result = await getProjectDomain(MOCK_DOMAIN);

    expect(result).toEqual({
      status: DOMAIN_VERIFICATION_STATUS.PENDING,
      dnsRecords: [
        {
          type: DNS_RECORD_TYPE_TXT,
          name: MOCK_CHALLENGE_NAME,
          value: MOCK_CHALLENGE_VALUE,
        },
      ],
    });
  });

  it('returns PENDING with no records when Vercel reports no challenges', async () => {
    fetchMock.mockResolvedValue(respondWith({ verified: false }));

    const result = await getProjectDomain(MOCK_DOMAIN);

    expect(result).toEqual({
      status: DOMAIN_VERIFICATION_STATUS.PENDING,
      dnsRecords: [],
    });
  });
});
