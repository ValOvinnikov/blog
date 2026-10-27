import { LOCALE_ISO_CODES, routes } from '@blog/config';
import { faker } from '@faker-js/faker';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

import { toPublicPathname } from './to-public-pathname';

faker.seed(6012);

const { EN, NL } = LOCALE_ISO_CODES;

const MOCK_POST_SLUG = faker.lorem.slug(2);

describe(toPublicPathname, () => {
  it.each([
    {
      case: 'strips the tenant and locale segments from a rewritten path',
      pathname: `/${MOCK_TENANT_ID}/${EN}${routes.post(MOCK_POST_SLUG)}`,
      expected: routes.post(MOCK_POST_SLUG),
    },
    {
      case: 'resolves the rewritten home path to the root',
      pathname: `/${MOCK_TENANT_ID}/${NL}`,
      expected: routes.home(),
    },
  ])('$case', ({ pathname, expected }) => {
    expect(toPublicPathname(pathname)).toBe(expected);
  });

  it.each([
    { case: 'a public path', pathname: routes.post(MOCK_POST_SLUG) },
    { case: 'the root', pathname: routes.home() },
    {
      case: 'a path whose second segment is not a locale',
      pathname: `/${MOCK_TENANT_ID}${routes.blogIndex()}`,
    },
  ])('leaves $case unchanged', ({ pathname }) => {
    expect(toPublicPathname(pathname)).toBe(pathname);
  });
});
