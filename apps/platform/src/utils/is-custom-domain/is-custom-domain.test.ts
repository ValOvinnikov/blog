import {
  MOCK_CUSTOM_DOMAIN,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ROOT_DOMAIN,
} from '@platform/testing/tenants/fixtures';

import { isCustomDomain } from './is-custom-domain';

describe(isCustomDomain.name, () => {
  it('is false for a platform address', () => {
    expect(isCustomDomain(MOCK_TENANT_DOMAIN, MOCK_TENANT_ROOT_DOMAIN)).toBe(
      false,
    );
  });

  it('is true for a domain outside the root domain', () => {
    expect(isCustomDomain(MOCK_CUSTOM_DOMAIN, MOCK_TENANT_ROOT_DOMAIN)).toBe(
      true,
    );
  });

  it('is true for every domain when no root domain is configured', () => {
    expect(isCustomDomain(MOCK_TENANT_DOMAIN, undefined)).toBe(true);
  });
});
