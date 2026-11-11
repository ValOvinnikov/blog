import { faker } from '@faker-js/faker';

import { toInSitePathname } from './to-in-site-pathname';

faker.seed(7179);

const MOCK_SLUG = faker.lorem.slug();
const MOCK_HOST = faker.internet.domainName();

describe(toInSitePathname, () => {
  it('keeps the pathname of a path on this site', () => {
    expect(toInSitePathname(`/${MOCK_SLUG}?draft=1#top`)).toBe(`/${MOCK_SLUG}`);
  });

  it.each([
    { case: 'nothing', path: null },
    { case: 'a bare slug', path: MOCK_SLUG },
    { case: 'an absolute URL', path: `https://${MOCK_HOST}/${MOCK_SLUG}` },
    { case: 'a protocol-relative URL', path: `//${MOCK_HOST}/${MOCK_SLUG}` },
    { case: 'a backslash host', path: `/\\${MOCK_HOST}/${MOCK_SLUG}` },
  ])('rejects $case', ({ path }) => {
    expect(toInSitePathname(path)).toBeUndefined();
  });
});
