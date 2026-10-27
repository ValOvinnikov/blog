import { HTTP_STATUS } from '@blog/config';
import { faker } from '@faker-js/faker';
import { DOMAIN_AVAILABILITY } from '@platform/constants/domain';
import { TENANT_LOG } from '@platform/constants/tenant';
import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';

import { checkDomainAvailability } from './check-domain-availability';

vi.mock('@platform/utils/env/env');

faker.seed(5997);

const envMock: Partial<Record<keyof typeof env, string>> = env;

const loggerErrorMock = vi.mocked(logger.error);
const fetchMock = vi.fn();

const lowerAlpha = (length: number) =>
  faker.string.alpha({ length, casing: 'lower' });

const MULTI_PART_SUFFIX = 'co.uk';
const MAX_PROJECT_DOMAINS_PAGES = 5;
const MOCK_VERCEL_TOKEN = faker.string.alphanumeric(24);
const MOCK_WEB_PROJECT_ID = `prj_${faker.string.alphanumeric(12)}`;
const MOCK_OTHER_PROJECT_ID = `prj_${faker.string.alphanumeric(12)}`;
const MOCK_APEX_DOMAIN = `${lowerAlpha(10)}.dev`;
const MOCK_DOMAIN = `${lowerAlpha(10)}.com`;
const MOCK_SUBDOMAIN = `${lowerAlpha(8)}.${MOCK_APEX_DOMAIN}`;
const MOCK_SIBLING_SUBDOMAIN = `${lowerAlpha(9)}.${MOCK_APEX_DOMAIN}`;
const MOCK_MULTI_PART_APEX = `${lowerAlpha(10)}.${MULTI_PART_SUFFIX}`;
const MOCK_MULTI_PART_SUBDOMAIN = `${lowerAlpha(4)}.${MOCK_MULTI_PART_APEX}`;
const MOCK_PAGE_CURSOR = faker.number.int({ min: 1e12, max: 2e12 });
const MOCK_IP_LITERAL_HOST = faker.internet.ipv4();
const MOCK_TRAVERSAL_DOMAIN = '../../v1/domains/other';
const MOCK_NETWORK_ERROR_MESSAGE = faker.lorem.words(2);

const projectDomainsPath = (apex: string) =>
  `/v1/domains/${apex}/project-domains`;

const respondWith = (body: unknown, status: number = HTTP_STATUS.OK) =>
  new Response(JSON.stringify(body), { status });

const requestedUrl = (callIndex: number) =>
  fetchMock.mock.calls[callIndex]?.[0] as URL;

describe(checkDomainAvailability, () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    envMock.VERCEL_API_TOKEN = MOCK_VERCEL_TOKEN;
    envMock.VERCEL_PROJECT_ID_WEB = MOCK_WEB_PROJECT_ID;
    envMock.VERCEL_TEAM_ID = undefined;
    fetchMock.mockResolvedValue(respondWith({ projectDomains: [] }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns NOT_CONFIGURED with no request when Vercel is not configured', async () => {
    envMock.VERCEL_API_TOKEN = undefined;
    envMock.VERCEL_PROJECT_ID_WEB = undefined;

    const result = await checkDomainAvailability(MOCK_DOMAIN);

    expect(result).toBe(DOMAIN_AVAILABILITY.NOT_CONFIGURED);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a path-traversal domain without making a request', async () => {
    const result = await checkDomainAvailability(MOCK_TRAVERSAL_DOMAIN);

    expect(result).toBe(DOMAIN_AVAILABILITY.ERROR);
    expect(loggerErrorMock).toHaveBeenCalledWith(
      TENANT_LOG.DOMAIN_AVAILABILITY_INVALID_DOMAIN,
      { domain: MOCK_TRAVERSAL_DOMAIN },
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([MULTI_PART_SUFFIX, MOCK_IP_LITERAL_HOST])(
    'returns ERROR with no request, and logs, when %s has no registrable domain',
    async (domain) => {
      const result = await checkDomainAvailability(domain);

      expect(result).toBe(DOMAIN_AVAILABILITY.ERROR);
      expect(fetchMock).not.toHaveBeenCalled();
      expect(loggerErrorMock).toHaveBeenCalledWith(
        TENANT_LOG.DOMAIN_AVAILABILITY_APEX_UNDETERMINED,
        { domain },
      );
    },
  );

  it.each([
    { domain: MOCK_SUBDOMAIN, apex: MOCK_APEX_DOMAIN },
    { domain: MOCK_MULTI_PART_SUBDOMAIN, apex: MOCK_MULTI_PART_APEX },
  ])(
    'looks the domain up by its registrable domain $apex',
    async ({ domain, apex }) => {
      await checkDomainAvailability(domain);

      expect(requestedUrl(0).pathname).toBe(projectDomainsPath(apex));
    },
  );

  it('returns AVAILABLE for a 404 response, the domain being unknown to the team', async () => {
    fetchMock.mockResolvedValue(respondWith(null, HTTP_STATUS.NOT_FOUND));

    const result = await checkDomainAvailability(MOCK_DOMAIN);

    expect(result).toBe(DOMAIN_AVAILABILITY.AVAILABLE);
  });

  it.each([
    {
      scenario: 'attached only to the shared web project',
      domain: MOCK_SUBDOMAIN,
      projectDomains: [
        { name: MOCK_SUBDOMAIN, projectId: MOCK_WEB_PROJECT_ID },
      ],
      expected: DOMAIN_AVAILABILITY.AVAILABLE,
    },
    {
      scenario: 'absent from the listed project domains',
      domain: MOCK_DOMAIN,
      projectDomains: [
        { name: MOCK_SIBLING_SUBDOMAIN, projectId: MOCK_OTHER_PROJECT_ID },
      ],
      expected: DOMAIN_AVAILABILITY.AVAILABLE,
    },
    {
      scenario: 'attached to a different project among unrelated ones',
      domain: MOCK_SUBDOMAIN,
      projectDomains: [
        { name: MOCK_SUBDOMAIN, projectId: MOCK_OTHER_PROJECT_ID },
        { name: MOCK_SIBLING_SUBDOMAIN, projectId: MOCK_WEB_PROJECT_ID },
      ],
      expected: DOMAIN_AVAILABILITY.IN_USE,
    },
    {
      scenario: 'listed with other casing and a trailing dot',
      domain: MOCK_DOMAIN,
      projectDomains: [
        {
          name: `${MOCK_DOMAIN.toUpperCase()}.`,
          projectId: MOCK_OTHER_PROJECT_ID,
        },
      ],
      expected: DOMAIN_AVAILABILITY.IN_USE,
    },
  ])(
    'returns $expected for a domain $scenario',
    async ({ domain, projectDomains, expected }) => {
      fetchMock.mockResolvedValue(respondWith({ projectDomains }));

      const result = await checkDomainAvailability(domain);

      expect(result).toBe(expected);
    },
  );

  it('follows the pagination cursor to a conflict on a later page', async () => {
    fetchMock
      .mockResolvedValueOnce(
        respondWith({
          projectDomains: [
            { name: MOCK_SIBLING_SUBDOMAIN, projectId: MOCK_OTHER_PROJECT_ID },
          ],
          pagination: { count: 1, next: MOCK_PAGE_CURSOR, prev: null },
        }),
      )
      .mockResolvedValueOnce(
        respondWith({
          projectDomains: [
            { name: MOCK_SUBDOMAIN, projectId: MOCK_OTHER_PROJECT_ID },
          ],
          pagination: { count: 1, next: null, prev: null },
        }),
      );

    const result = await checkDomainAvailability(MOCK_SUBDOMAIN);

    expect(result).toBe(DOMAIN_AVAILABILITY.IN_USE);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(requestedUrl(1).searchParams.get('until')).toBe(
      String(MOCK_PAGE_CURSOR),
    );
  });

  it('stops requesting pages once a conflict is found', async () => {
    fetchMock.mockResolvedValueOnce(
      respondWith({
        projectDomains: [
          { name: MOCK_SUBDOMAIN, projectId: MOCK_OTHER_PROJECT_ID },
        ],
        pagination: { count: 1, next: MOCK_PAGE_CURSOR, prev: null },
      }),
    );

    const result = await checkDomainAvailability(MOCK_SUBDOMAIN);

    expect(result).toBe(DOMAIN_AVAILABILITY.IN_USE);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns ERROR, not AVAILABLE, when the page cap runs out inconclusively', async () => {
    fetchMock.mockImplementation(async () =>
      respondWith({
        projectDomains: [
          { name: MOCK_SIBLING_SUBDOMAIN, projectId: MOCK_OTHER_PROJECT_ID },
        ],
        pagination: { count: 1, next: MOCK_PAGE_CURSOR, prev: null },
      }),
    );

    const result = await checkDomainAvailability(MOCK_SUBDOMAIN);

    expect(result).toBe(DOMAIN_AVAILABILITY.ERROR);
    expect(fetchMock).toHaveBeenCalledTimes(MAX_PROJECT_DOMAINS_PAGES);
  });

  it('returns ERROR for an unexpected non-2xx response', async () => {
    fetchMock.mockResolvedValue(
      respondWith(null, HTTP_STATUS.INTERNAL_SERVER_ERROR),
    );

    const result = await checkDomainAvailability(MOCK_DOMAIN);

    expect(result).toBe(DOMAIN_AVAILABILITY.ERROR);
  });

  it('returns ERROR when the request throws', async () => {
    fetchMock.mockRejectedValue(new Error(MOCK_NETWORK_ERROR_MESSAGE));

    const result = await checkDomainAvailability(MOCK_DOMAIN);

    expect(result).toBe(DOMAIN_AVAILABILITY.ERROR);
  });
});
