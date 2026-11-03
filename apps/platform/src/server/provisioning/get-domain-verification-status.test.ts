import { faker } from '@faker-js/faker';
import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import { mockJsonResponse } from '@platform/testing/http/mock-json-response';
import { env } from '@platform/utils/env/env';

import { getDomainVerificationStatus } from './get-domain-verification-status';

vi.mock('@platform/utils/env/env');

faker.seed(5997);

const envMock: Partial<Record<keyof typeof env, string>> = env;

const fetchMock = vi.fn();

describe(getDomainVerificationStatus, () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    envMock.VERCEL_API_TOKEN = faker.string.alphanumeric(24);
    envMock.VERCEL_PROJECT_ID_WEB = `prj_${faker.string.alphanumeric(12)}`;
    envMock.VERCEL_TEAM_ID = undefined;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the status of the domain's Vercel project entry and configuration", async () => {
    fetchMock
      .mockResolvedValueOnce(mockJsonResponse({ verified: true }))
      .mockResolvedValueOnce(mockJsonResponse({ misconfigured: false }));

    const result = await getDomainVerificationStatus(
      faker.internet.domainName(),
    );

    expect(result).toBe(DOMAIN_VERIFICATION_STATUS.VERIFIED);
  });
});
