import { HTTP_STATUS } from '@blog/config';
import { faker } from '@faker-js/faker';
import { CUSTOM_DOMAIN_TXT_TYPE } from '@platform/constants/custom-domain';
import {
  DOMAIN_VERIFICATION_STATUS,
  ROUTING_RECORD_TYPE,
} from '@platform/constants/domain';
import { PROVISIONING_LOG } from '@platform/constants/provisioning';
import { mockJsonResponse } from '@platform/testing/http/mock-json-response';
import { requestedUrl } from '@platform/testing/http/requested-url';
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
const MOCK_APEX_DOMAIN = faker.internet.domainName();
const MOCK_SUBDOMAIN = `${faker.internet.domainWord()}.${MOCK_APEX_DOMAIN}`;
const MOCK_A_RECORD_VALUE = faker.internet.ipv4();
const MOCK_OTHER_A_RECORD_VALUE = faker.internet.ipv4();
const MOCK_CNAME_VALUE = `${faker.internet.domainWord()}.vercel-dns-${faker.string.alphanumeric(3)}.com.`;
const MOCK_OTHER_CNAME_VALUE = `${faker.internet.domainWord()}.vercel-dns.com.`;
const MOCK_CHALLENGE = {
  type: CUSTOM_DOMAIN_TXT_TYPE,
  domain: MOCK_CHALLENGE_NAME,
  value: MOCK_CHALLENGE_VALUE,
};
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

const respondWith = (...responses: Response[]) => {
  for (const response of responses) fetchMock.mockResolvedValueOnce(response);
};

const respondOwned = (
  config: Record<string, unknown>,
  projectDomain: Record<string, unknown> = {},
) =>
  respondWith(
    mockJsonResponse({ verified: true, ...projectDomain }),
    mockJsonResponse(config),
  );

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

  describe('scoped to a team', () => {
    beforeEach(() => {
      envMock.VERCEL_TEAM_ID = MOCK_TEAM_ID;
    });

    it('makes exactly one authenticated request for an unowned domain', async () => {
      respondWith(mockJsonResponse({ verified: false }));

      await getProjectDomain(MOCK_DOMAIN);

      expect(fetchMock).toHaveBeenCalledOnce();
      const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
      expect(requestedUrl(fetchMock, 0).pathname).toBe(
        `/v9/projects/${MOCK_PROJECT_ID}/domains/${MOCK_DOMAIN}`,
      );
      expect(requestedUrl(fetchMock, 0).searchParams.get('teamId')).toBe(
        MOCK_TEAM_ID,
      );
      expect(init.headers).toEqual({
        Authorization: `Bearer ${MOCK_VERCEL_TOKEN}`,
      });
    });

    it("checks an owned domain's configuration against the web project", async () => {
      respondOwned({ misconfigured: false });

      await getProjectDomain(MOCK_DOMAIN);

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(requestedUrl(fetchMock, 1).pathname).toBe(
        `/v6/domains/${MOCK_DOMAIN}/config`,
      );
      expect(
        requestedUrl(fetchMock, 1).searchParams.get('projectIdOrName'),
      ).toBe(MOCK_PROJECT_ID);
      expect(requestedUrl(fetchMock, 1).searchParams.get('teamId')).toBe(
        MOCK_TEAM_ID,
      );
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

  it.each([
    {
      expected: DOMAIN_VERIFICATION_STATUS.NOT_ADDED,
      scenario: 'a domain the project does not hold',
      responses: () => [mockJsonResponse(null, HTTP_STATUS.NOT_FOUND)],
    },
    {
      expected: DOMAIN_VERIFICATION_STATUS.PENDING,
      scenario: 'an unowned domain with no challenges',
      responses: () => [mockJsonResponse({ verified: false })],
    },
    {
      expected: DOMAIN_VERIFICATION_STATUS.VERIFIED,
      scenario: 'an owned domain that routes, even with challenges listed',
      responses: () => [
        mockJsonResponse({ verified: true, verification: [MOCK_CHALLENGE] }),
        mockJsonResponse({ misconfigured: false }),
      ],
    },
    {
      expected: DOMAIN_VERIFICATION_STATUS.PENDING,
      scenario: 'an owned domain that does not route and has no recommendation',
      responses: () => [
        mockJsonResponse({ verified: true }),
        mockJsonResponse({ misconfigured: true }),
      ],
    },
  ])(
    'returns $expected with no records for $scenario',
    async ({ responses, expected }) => {
      respondWith(...responses());

      const result = await getProjectDomain(MOCK_DOMAIN);

      expect(result).toEqual({ status: expected, dnsRecords: [] });
    },
  );

  it.each([
    {
      scenario: 'an unexpected non-2xx project response',
      responses: () => [
        mockJsonResponse(null, HTTP_STATUS.INTERNAL_SERVER_ERROR),
      ],
      event: PROVISIONING_LOG.DOMAIN_CHECK_FAILED,
    },
    {
      scenario: 'a failed configuration check',
      responses: () => [
        mockJsonResponse({ verified: true }),
        mockJsonResponse(null, HTTP_STATUS.INTERNAL_SERVER_ERROR),
      ],
      event: PROVISIONING_LOG.DOMAIN_CONFIG_CHECK_FAILED,
    },
  ])(
    'returns ERROR with no records and logs for $scenario',
    async ({ responses, event }) => {
      respondWith(...responses());

      const result = await getProjectDomain(MOCK_DOMAIN);

      expect(result).toEqual({
        status: DOMAIN_VERIFICATION_STATUS.ERROR,
        dnsRecords: [],
      });
      expect(loggerErrorMock).toHaveBeenCalledWith(event, {
        domain: MOCK_DOMAIN,
        responseStatus: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      });
    },
  );

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

  it('returns PENDING with the verification challenges as type/name/value records', async () => {
    respondWith(
      mockJsonResponse({
        verified: false,
        verification: [{ ...MOCK_CHALLENGE, reason: 'pending_domain' }],
      }),
    );

    const result = await getProjectDomain(MOCK_DOMAIN);

    expect(result).toEqual({
      status: DOMAIN_VERIFICATION_STATUS.PENDING,
      dnsRecords: [
        {
          type: CUSTOM_DOMAIN_TXT_TYPE,
          name: MOCK_CHALLENGE_NAME,
          value: MOCK_CHALLENGE_VALUE,
        },
      ],
    });
  });

  it.each([
    {
      scenario: 'subdomain',
      domain: MOCK_SUBDOMAIN,
      type: ROUTING_RECORD_TYPE.CNAME,
      value: MOCK_CNAME_VALUE,
    },
    {
      scenario: 'apex domain',
      domain: MOCK_APEX_DOMAIN,
      type: ROUTING_RECORD_TYPE.A,
      value: MOCK_A_RECORD_VALUE,
    },
  ])(
    'returns PENDING with the preferred $type record for an owned $scenario that does not route',
    async ({ domain, type, value }) => {
      respondOwned(
        { misconfigured: true, ...ROUTING_OPTIONS },
        { name: domain, apexName: MOCK_APEX_DOMAIN },
      );

      const result = await getProjectDomain(domain);

      expect(result).toEqual({
        status: DOMAIN_VERIFICATION_STATUS.PENDING,
        dnsRecords: [{ type, name: domain, value }],
      });
    },
  );
});
