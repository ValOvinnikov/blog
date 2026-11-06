import { OAUTH_PROVIDER } from '@blog/config/constants';
import { MOCK_GOOGLE_CALLBACK_URL } from '@platform/testing/sign-in-apps/fixtures';
import { MOCK_TENANT_DOMAIN } from '@platform/testing/tenants/fixtures';

import { oauthCallbackUrl } from './oauth-callback-url';

describe(oauthCallbackUrl, () => {
  it("builds the provider's Auth.js callback on the site's domain", () => {
    expect(oauthCallbackUrl(MOCK_TENANT_DOMAIN, OAUTH_PROVIDER.GOOGLE)).toBe(
      MOCK_GOOGLE_CALLBACK_URL,
    );
  });
});
