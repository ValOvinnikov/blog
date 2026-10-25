import { MOCK_TENANT_ROOT_DOMAIN } from '@platform/testing/env/fixtures';

import { toLegalPageUrls } from './legal-page-urls';

describe(toLegalPageUrls, () => {
  it('points both pages at the marketing site on the apex', () => {
    expect(toLegalPageUrls(MOCK_TENANT_ROOT_DOMAIN)).toEqual({
      terms: `https://${MOCK_TENANT_ROOT_DOMAIN}/terms`,
      privacy: `https://${MOCK_TENANT_ROOT_DOMAIN}/privacy`,
    });
  });

  it('has no pages to link to without a root domain', () => {
    expect(toLegalPageUrls(undefined)).toBeUndefined();
  });
});
