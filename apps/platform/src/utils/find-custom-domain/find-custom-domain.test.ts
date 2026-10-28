import {
  MOCK_CUSTOM_DOMAIN,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ROOT_DOMAIN,
} from '@platform/testing/tenants/fixtures';

import { findCustomDomain } from './find-custom-domain';

const rows = (...domains: string[]) => domains.map((domain) => ({ domain }));

describe(findCustomDomain.name, () => {
  it('returns the host outside the root domain', () => {
    const result = findCustomDomain(
      rows(MOCK_TENANT_DOMAIN, MOCK_CUSTOM_DOMAIN),
      MOCK_TENANT_DOMAIN,
      MOCK_TENANT_ROOT_DOMAIN,
    );

    expect(result).toBe(MOCK_CUSTOM_DOMAIN);
  });

  it('returns nothing when only platform addresses exist', () => {
    const result = findCustomDomain(
      rows(MOCK_TENANT_DOMAIN),
      MOCK_TENANT_DOMAIN,
      MOCK_TENANT_ROOT_DOMAIN,
    );

    expect(result).toBeUndefined();
  });

  it('does not count the primary domain as a custom domain', () => {
    const result = findCustomDomain(
      rows(MOCK_TENANT_DOMAIN, MOCK_CUSTOM_DOMAIN),
      MOCK_CUSTOM_DOMAIN,
      MOCK_TENANT_ROOT_DOMAIN,
    );

    expect(result).toBeUndefined();
  });

  it('returns nothing for a tenant with no rows', () => {
    const result = findCustomDomain(
      [],
      MOCK_TENANT_DOMAIN,
      MOCK_TENANT_ROOT_DOMAIN,
    );

    expect(result).toBeUndefined();
  });
});
