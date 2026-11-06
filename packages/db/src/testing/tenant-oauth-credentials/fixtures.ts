import type { TOAuthCredentials } from '@blog/config';
import { createMockFaker } from '@blog/db/testing/mock-faker';

const oauthCredentialsFaker = createMockFaker(61004);

function buildMockOAuthCredentials(): TOAuthCredentials {
  return {
    clientId: oauthCredentialsFaker.string.alphanumeric(20),
    clientSecret: oauthCredentialsFaker.string.alphanumeric(40),
  };
}

export const MOCK_OAUTH_CREDENTIALS = buildMockOAuthCredentials();
export const MOCK_REPLACEMENT_OAUTH_CREDENTIALS = buildMockOAuthCredentials();
