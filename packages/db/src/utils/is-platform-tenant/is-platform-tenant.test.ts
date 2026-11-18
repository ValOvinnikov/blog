import {
  MOCK_MARKETING_TENANT_DOMAIN,
  MOCK_OTHER_TENANT_DOMAIN,
  MOCK_WWW_TENANT_DOMAIN,
} from '@shinefold/db/testing/tenant-domains/fixtures';
import { MOCK_TENANT_DOMAIN } from '@shinefold/db/testing/tenants/fixtures';

import { isPlatformTenant } from './is-platform-tenant';

describe(isPlatformTenant, () => {
  it.each([
    ['the root domain', MOCK_TENANT_DOMAIN],
    ['the www host of the root domain', MOCK_WWW_TENANT_DOMAIN],
  ])('recognises a tenant holding %s', (_, host) => {
    expect(
      isPlatformTenant([MOCK_OTHER_TENANT_DOMAIN, host], MOCK_TENANT_DOMAIN),
    ).toBe(true);
  });

  it('ignores case and surrounding whitespace in the root domain', () => {
    expect(
      isPlatformTenant(
        [MOCK_TENANT_DOMAIN],
        ` ${MOCK_TENANT_DOMAIN.toUpperCase()} `,
      ),
    ).toBe(true);
  });

  it('does not treat a subdomain of the root domain as the platform tenant', () => {
    expect(
      isPlatformTenant([MOCK_OTHER_TENANT_DOMAIN], MOCK_TENANT_DOMAIN),
    ).toBe(false);
  });

  it('does not treat a tenant with no hosts as the platform tenant', () => {
    expect(isPlatformTenant([], MOCK_TENANT_DOMAIN)).toBe(false);
  });

  it('recognises a tenant holding the marketing host', () => {
    expect(
      isPlatformTenant(
        [MOCK_OTHER_TENANT_DOMAIN, MOCK_MARKETING_TENANT_DOMAIN],
        MOCK_TENANT_DOMAIN,
        MOCK_MARKETING_TENANT_DOMAIN,
      ),
    ).toBe(true);
  });

  it('ignores case and surrounding whitespace in the marketing host', () => {
    expect(
      isPlatformTenant(
        [MOCK_MARKETING_TENANT_DOMAIN],
        MOCK_TENANT_DOMAIN,
        ` ${MOCK_MARKETING_TENANT_DOMAIN.toUpperCase()} `,
      ),
    ).toBe(true);
  });

  it('does not treat the marketing host as the platform tenant when none is given', () => {
    expect(
      isPlatformTenant([MOCK_MARKETING_TENANT_DOMAIN], MOCK_TENANT_DOMAIN),
    ).toBe(false);
  });

  it.each([
    ['empty', ''],
    ['blank', '   '],
  ])('matches nothing extra for an %s marketing host', (_, marketingHost) => {
    expect(
      isPlatformTenant(
        [MOCK_OTHER_TENANT_DOMAIN, ''],
        MOCK_TENANT_DOMAIN,
        marketingHost,
      ),
    ).toBe(false);
  });
});
