import { OAUTH_PROVIDER } from '@blog/config/constants';
import { createMockFaker } from '@web/testing/mock-faker';

const siteCredentialsFaker = createMockFaker(6772);

export const MOCK_SITE_OAUTH_CREDENTIALS = {
  [OAUTH_PROVIDER.GITHUB]: {
    clientId: siteCredentialsFaker.string.alphanumeric(20),
    clientSecret: siteCredentialsFaker.string.alphanumeric(40),
  },
};
