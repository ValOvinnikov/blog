import {
  MOCK_CUSTOM_DOMAIN,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ROOT_DOMAIN,
} from '@platform/testing/tenants/fixtures';

import { isReservedDomain } from './is-reserved-domain';

const WEB_APP_URL = 'https://web.example.net';
const PLATFORM_APP_BASE_URL = 'https://admin.example.net';
const APP_URLS = [WEB_APP_URL, PLATFORM_APP_BASE_URL, undefined];

describe(isReservedDomain, () => {
  it.each([
    ['the bare root domain', MOCK_TENANT_ROOT_DOMAIN],
    ['a host under the root domain', MOCK_TENANT_DOMAIN],
    ['the web app host', 'web.example.net'],
    ['the platform app host', 'admin.example.net'],
  ])('reserves %s', (_name, domain) => {
    const result = isReservedDomain(domain, MOCK_TENANT_ROOT_DOMAIN, APP_URLS);

    expect(result).toBe(true);
  });

  it('leaves an unrelated domain free', () => {
    const result = isReservedDomain(
      MOCK_CUSTOM_DOMAIN,
      MOCK_TENANT_ROOT_DOMAIN,
      APP_URLS,
    );

    expect(result).toBe(false);
  });
});
