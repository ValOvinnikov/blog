import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

import { toPublicPathname } from './to-public-pathname';

describe(toPublicPathname, () => {
  it.each([
    {
      case: 'strips the tenant and locale segments from a rewritten path',
      pathname: `/${MOCK_TENANT_ID}/EN/modules/latest-posts`,
      expected: '/modules/latest-posts',
    },
    {
      case: 'resolves the rewritten home path to the root',
      pathname: `/${MOCK_TENANT_ID}/NL`,
      expected: '/',
    },
  ])('$case', ({ pathname, expected }) => {
    expect(toPublicPathname(pathname)).toBe(expected);
  });

  it.each([
    { case: 'a public path', pathname: '/blog/hello-world' },
    { case: 'the root', pathname: '/' },
    {
      case: 'a path whose second segment is not a locale',
      pathname: `/${MOCK_TENANT_ID}/blog`,
    },
  ])('leaves $case unchanged', ({ pathname }) => {
    expect(toPublicPathname(pathname)).toBe(pathname);
  });
});
