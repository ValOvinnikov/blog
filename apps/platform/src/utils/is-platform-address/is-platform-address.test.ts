import {
  MOCK_CUSTOM_DOMAIN,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ROOT_DOMAIN,
} from '@platform/testing/tenants/fixtures';

import { isPlatformAddress } from './is-platform-address';

describe(isPlatformAddress.name, () => {
  it('recognises a subdomain of the root domain', () => {
    expect(isPlatformAddress(MOCK_TENANT_DOMAIN, MOCK_TENANT_ROOT_DOMAIN)).toBe(
      true,
    );
  });

  it('treats any other domain as custom', () => {
    expect(isPlatformAddress(MOCK_CUSTOM_DOMAIN, MOCK_TENANT_ROOT_DOMAIN)).toBe(
      false,
    );
  });

  it('does not match a domain that only ends with the root domain text', () => {
    expect(
      isPlatformAddress(
        `not${MOCK_TENANT_ROOT_DOMAIN}`,
        MOCK_TENANT_ROOT_DOMAIN,
      ),
    ).toBe(false);
  });

  it('treats every domain as custom when no root domain is configured', () => {
    expect(isPlatformAddress(MOCK_TENANT_DOMAIN, undefined)).toBe(false);
  });
});
