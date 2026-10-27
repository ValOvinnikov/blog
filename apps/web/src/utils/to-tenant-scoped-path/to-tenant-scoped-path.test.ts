import { LOCALE_ISO_CODES, routes } from '@blog/config';
import { faker } from '@faker-js/faker';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

import { toTenantScopedPath } from './to-tenant-scoped-path';

faker.seed(6012);

const { EN } = LOCALE_ISO_CODES;

const MOCK_POST_SLUG = faker.lorem.slug(2);

describe(toTenantScopedPath, () => {
  it('prefixes a non-home path with the tenant and locale segments', () => {
    expect(
      toTenantScopedPath(MOCK_TENANT_ID, EN, routes.post(MOCK_POST_SLUG)),
    ).toBe(`/${MOCK_TENANT_ID}/${EN}${routes.post(MOCK_POST_SLUG)}`);
  });

  it('drops the trailing slash for the home path', () => {
    expect(toTenantScopedPath(MOCK_TENANT_ID, EN, routes.home())).toBe(
      `/${MOCK_TENANT_ID}/${EN}`,
    );
  });
});
