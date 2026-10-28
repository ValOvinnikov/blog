import { HTTP_METHOD, HTTP_STATUS } from '@blog/config';
import {
  emptyResponse,
  firstFetchCall,
  nthFetchCall,
  textResponse,
  useFetchFake,
} from '@blog/db/testing/sanity-management-client/fetch-fake';
import { faker } from '@faker-js/faker';

import {
  deleteVercelProjectDomain,
  deleteVercelProjectDomains,
  VERCEL_API_BASE,
} from './vercel-project-domains';

faker.seed(9042);

const MOCK_TEAM_ID = faker.string.alphanumeric(10);
const MOCK_FAILURE_BODY = faker.lorem.words(2);
const MOCK_DOMAIN_INPUT = {
  token: faker.string.alphanumeric(16),
  teamId: undefined,
  projectId: faker.string.alphanumeric(12),
  domain: faker.internet.domainName(),
};
const DOMAIN_PATH = `/v9/projects/${MOCK_DOMAIN_INPUT.projectId}/domains/${MOCK_DOMAIN_INPUT.domain}`;

const fetchMock = useFetchFake();

beforeEach(() => {
  fetchMock.mockResolvedValue(emptyResponse());
});

describe(deleteVercelProjectDomain, () => {
  it('DELETEs the project domain with the bearer token', async () => {
    const result = await deleteVercelProjectDomain(MOCK_DOMAIN_INPUT);

    const { url, method, headers } = firstFetchCall(fetchMock);
    expect(result).toEqual({ alreadyGone: false });
    expect(url).toBe(`${VERCEL_API_BASE}${DOMAIN_PATH}`);
    expect(method).toBe(HTTP_METHOD.DELETE);
    expect(headers).toEqual({
      Authorization: `Bearer ${MOCK_DOMAIN_INPUT.token}`,
    });
  });

  it('appends teamId as a query param when supplied', async () => {
    await deleteVercelProjectDomain({
      ...MOCK_DOMAIN_INPUT,
      teamId: MOCK_TEAM_ID,
    });

    const { url } = firstFetchCall(fetchMock);
    expect(url).toBe(`${VERCEL_API_BASE}${DOMAIN_PATH}?teamId=${MOCK_TEAM_ID}`);
  });

  it('treats a 404 as already gone', async () => {
    fetchMock.mockResolvedValue(
      textResponse(MOCK_FAILURE_BODY, HTTP_STATUS.NOT_FOUND),
    );

    await expect(deleteVercelProjectDomain(MOCK_DOMAIN_INPUT)).resolves.toEqual(
      { alreadyGone: true },
    );
  });

  it('throws with the response status and body on failure', async () => {
    fetchMock.mockResolvedValue(
      textResponse(MOCK_FAILURE_BODY, HTTP_STATUS.BAD_REQUEST),
    );

    await expect(deleteVercelProjectDomain(MOCK_DOMAIN_INPUT)).rejects.toThrow(
      `Vercel API DELETE ${DOMAIN_PATH} failed: ${HTTP_STATUS.BAD_REQUEST} ${MOCK_FAILURE_BODY}`,
    );
  });
});

describe(deleteVercelProjectDomains, () => {
  it('deletes each distinct domain from the project', async () => {
    const other = faker.internet.domainName();
    const { domain, ...target } = MOCK_DOMAIN_INPUT;

    await deleteVercelProjectDomains({
      ...target,
      domains: [domain, other, domain],
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(nthFetchCall(fetchMock, 1).url).toBe(
      `${VERCEL_API_BASE}/v9/projects/${target.projectId}/domains/${other}`,
    );
  });

  it('keeps going when a domain is already gone', async () => {
    fetchMock.mockResolvedValueOnce(emptyResponse(HTTP_STATUS.NOT_FOUND));
    const { domain, ...target } = MOCK_DOMAIN_INPUT;

    await deleteVercelProjectDomains({
      ...target,
      domains: [domain, faker.internet.domainName()],
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
