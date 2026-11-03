import {
  MOCK_CUSTOM_DOMAIN,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ROOT_DOMAIN,
} from '@platform/testing/tenants/fixtures';

import { findSubdomain } from './find-subdomain';

const rows = (...domains: string[]) => domains.map((domain) => ({ domain }));

describe(findSubdomain.name, () => {
  it.each([
    {
      scenario: 'the host under the root domain beside a custom domain',
      tenantDomains: rows(MOCK_CUSTOM_DOMAIN, MOCK_TENANT_DOMAIN),
      rootDomain: MOCK_TENANT_ROOT_DOMAIN,
      expected: MOCK_TENANT_DOMAIN,
    },
    {
      scenario: 'nothing when only a custom domain exists',
      tenantDomains: rows(MOCK_CUSTOM_DOMAIN),
      rootDomain: MOCK_TENANT_ROOT_DOMAIN,
      expected: undefined,
    },
    {
      scenario: 'nothing when the root domain is unset',
      tenantDomains: rows(MOCK_TENANT_DOMAIN),
      rootDomain: undefined,
      expected: undefined,
    },
  ])('returns $scenario', ({ tenantDomains, rootDomain, expected }) => {
    expect(findSubdomain(tenantDomains, rootDomain)).toBe(expected);
  });
});
