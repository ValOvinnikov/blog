import { faker } from '@faker-js/faker';
import { MOCK_TENANT_ROOT_DOMAIN } from '@platform/testing/tenants/fixtures';
import { LEGAL_PAGE_KIND, routes } from '@shinefold/config';

import { toLegalPageUrls } from './legal-page-urls';

const MOCK_MARKETING_SITE_URL = faker.internet.url({ appendSlash: false });

describe(toLegalPageUrls, () => {
  it('points both pages at the configured marketing site’s by-kind redirect', () => {
    expect(
      toLegalPageUrls({
        marketingSiteUrl: MOCK_MARKETING_SITE_URL,
        rootDomain: MOCK_TENANT_ROOT_DOMAIN,
      }),
    ).toEqual({
      terms: `${MOCK_MARKETING_SITE_URL}${routes.legalPageByKind(LEGAL_PAGE_KIND.TERMS)}`,
      privacy: `${MOCK_MARKETING_SITE_URL}${routes.legalPageByKind(LEGAL_PAGE_KIND.PRIVACY_POLICY)}`,
    });
  });

  it('does not double the slash when the marketing site URL ends in one', () => {
    expect(
      toLegalPageUrls({
        marketingSiteUrl: `${MOCK_MARKETING_SITE_URL}/`,
        rootDomain: undefined,
      })?.terms,
    ).toBe(
      `${MOCK_MARKETING_SITE_URL}${routes.legalPageByKind(LEGAL_PAGE_KIND.TERMS)}`,
    );
  });

  it('has no pages to link to without either', () => {
    expect(
      toLegalPageUrls({ marketingSiteUrl: undefined, rootDomain: undefined }),
    ).toBeUndefined();
  });
});
