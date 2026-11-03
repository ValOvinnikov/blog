import { HTTP_STATUS } from '@blog/config';
import { faker } from '@faker-js/faker';
import {
  DOMAIN_VERIFICATION_STATUS,
  ROUTING_RECORD_TYPE,
} from '@platform/constants/domain';
import { PROVISIONING_LOG } from '@platform/constants/provisioning';
import { mockJsonResponse } from '@platform/testing/http/mock-json-response';
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
const MOCK_APEX_DOMAIN = faker.internet.domainName();
const MOCK_SUBDOMAIN = `${faker.internet.domainWord()}.${MOCK_APEX_DOMAIN}`;
const MOCK_A_RECORD_VALUE = faker.internet.ipv4();
const MOCK_OTHER_A_RECORD_VALUE = faker.internet.ipv4();
const MOCK_CNAME_VALUE = `${faker.internet.domainWord()}.vercel-dns-${faker.string.alphanumeric(3)}.com.`;
const MOCK_OTHER_CNAME_VALUE = `${faker.internet.domainWord()}.vercel-dns.com.`;
const ROUTING_OPTIONS = {
  recommendedIPv4: [
    { rank: 2, value: [MOCK_OTHER_A_RECORD_VALUE] },
    { rank: 1, value: [MOCK_A_RECORD_VALUE] },
  ],
  recommendedCNAME: [
    { rank: 2, value: MOCK_OTHER_CNAME_VALUE },
    { rank: 1, value: MOCK_CNAME_VALUE },
  ],
};

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
    fetchMock.mockResolvedValue(mockJsonResponse({ verified: false }));

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
    fetchMock.mockResolvedValue(mockJsonResponse(null, HTTP_STATUS.NOT_FOUND));

    const result = await getProjectDomain(MOCK_DOMAIN);

    expect(result).toEqual({
      status: DOMAIN_VERIFICATION_STATUS.NOT_ADDED,
      dnsRecords: [],
    });
  });

  it('returns ERROR with no records for an unexpected non-2xx response', async () => {
    fetchMock.mockResolvedValue(
      mockJsonResponse(null, HTTP_STATUS.INTERNAL_SERVER_ERROR),
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

  it('returns VERIFIED with no records once the domain is owned and routes, even if Vercel still lists challenges', async () => {
    fetchMock
      .mockResolvedValueOnce(
        mockJsonResponse({
          name: MOCK_DOMAIN,
          apexName: MOCK_DOMAIN,
          verified: true,
          verification: [
            {
              type: DNS_RECORD_TYPE_TXT,
              domain: MOCK_CHALLENGE_NAME,
              value: MOCK_CHALLENGE_VALUE,
            },
          ],
        }),
      )
      .mockResolvedValueOnce(mockJsonResponse({ misconfigured: false }));

    const result = await getProjectDomain(MOCK_DOMAIN);

    expect(result).toEqual({
      status: DOMAIN_VERIFICATION_STATUS.VERIFIED,
      dnsRecords: [],
    });
  });

  it("checks the domain's configuration against the web project once it is owned", async () => {
    envMock.VERCEL_TEAM_ID = MOCK_TEAM_ID;
    fetchMock
      .mockResolvedValueOnce(mockJsonResponse({ verified: true }))
      .mockResolvedValueOnce(mockJsonResponse({ misconfigured: false }));

    await getProjectDomain(MOCK_DOMAIN);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [calledUrl] = fetchMock.mock.calls[1] as [URL];
    expect(calledUrl.pathname).toBe(`/v6/domains/${MOCK_DOMAIN}/config`);
    expect(calledUrl.searchParams.get('projectIdOrName')).toBe(MOCK_PROJECT_ID);
    expect(calledUrl.searchParams.get('teamId')).toBe(MOCK_TEAM_ID);
  });

  it('returns PENDING with the preferred CNAME record for an owned subdomain that does not route', async () => {
    fetchMock
      .mockResolvedValueOnce(
        mockJsonResponse({
          name: MOCK_SUBDOMAIN,
          apexName: MOCK_APEX_DOMAIN,
          verified: true,
        }),
      )
      .mockResolvedValueOnce(
        mockJsonResponse({ misconfigured: true, ...ROUTING_OPTIONS }),
      );

    const result = await getProjectDomain(MOCK_SUBDOMAIN);

    expect(result).toEqual({
      status: DOMAIN_VERIFICATION_STATUS.PENDING,
      dnsRecords: [
        {
          type: ROUTING_RECORD_TYPE.CNAME,
          name: MOCK_SUBDOMAIN,
          value: MOCK_CNAME_VALUE,
        },
      ],
    });
  });

  it('returns PENDING with the preferred A record for an owned apex domain that does not route', async () => {
    fetchMock
      .mockResolvedValueOnce(
        mockJsonResponse({
          name: MOCK_APEX_DOMAIN,
          apexName: MOCK_APEX_DOMAIN,
          verified: true,
        }),
      )
      .mockResolvedValueOnce(
        mockJsonResponse({ misconfigured: true, ...ROUTING_OPTIONS }),
      );

    const result = await getProjectDomain(MOCK_APEX_DOMAIN);

    expect(result).toEqual({
      status: DOMAIN_VERIFICATION_STATUS.PENDING,
      dnsRecords: [
        {
          type: ROUTING_RECORD_TYPE.A,
          name: MOCK_APEX_DOMAIN,
          value: MOCK_A_RECORD_VALUE,
        },
      ],
    });
  });

  it('returns PENDING with no records when Vercel recommends no routing record', async () => {
    fetchMock
      .mockResolvedValueOnce(mockJsonResponse({ verified: true }))
      .mockResolvedValueOnce(mockJsonResponse({ misconfigured: true }));

    const result = await getProjectDomain(MOCK_DOMAIN);

    expect(result).toEqual({
      status: DOMAIN_VERIFICATION_STATUS.PENDING,
      dnsRecords: [],
    });
  });

  it('returns ERROR and logs when the configuration check fails', async () => {
    fetchMock
      .mockResolvedValueOnce(mockJsonResponse({ verified: true }))
      .mockResolvedValueOnce(
        mockJsonResponse(null, HTTP_STATUS.INTERNAL_SERVER_ERROR),
      );

    const result = await getProjectDomain(MOCK_DOMAIN);

    expect(result).toEqual({
      status: DOMAIN_VERIFICATION_STATUS.ERROR,
      dnsRecords: [],
    });
    expect(loggerErrorMock).toHaveBeenCalledWith(
      PROVISIONING_LOG.DOMAIN_CONFIG_CHECK_FAILED,
      {
        domain: MOCK_DOMAIN,
        responseStatus: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      },
    );
  });

  it('returns PENDING with the verification challenges as type/name/value records', async () => {
    fetchMock.mockResolvedValue(
      mockJsonResponse({
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
    fetchMock.mockResolvedValue(mockJsonResponse({ verified: false }));

    const result = await getProjectDomain(MOCK_DOMAIN);

    expect(result).toEqual({
      status: DOMAIN_VERIFICATION_STATUS.PENDING,
      dnsRecords: [],
    });
  });
});
