import { LOCALE_ISO_CODES, NEWSLETTER_RESULT, routes } from '@blog/config';
import { faker } from '@faker-js/faker';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { mockTenantPageLists } from '@web/testing/shared/tenant-page-lists/fixtures';
import { toTenantScopedPath } from '@web/utils/to-tenant-scoped-path';

import { buildTenantSitePaths } from './build-tenant-site-paths';

faker.seed(7382);

const { EN, NL } = LOCALE_ISO_CODES;
const [
  MOCK_POST_SLUG,
  MOCK_REMOVED_POST_SLUG,
  MOCK_TOPIC_SLUG,
  MOCK_TAG_SLUG,
  MOCK_LANDING_SLUG,
  MOCK_PRIVACY_SLUG,
  MOCK_LEGAL_SLUG,
] = faker.helpers.uniqueArray(faker.lorem.slug, 7) as [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];
const MOCK_PAGE = '2';

const scoped = (locale: string, path: string) =>
  toTenantScopedPath(MOCK_TENANT_ID, locale, path);

const everyLanguagePaths = (locale: string): string[] =>
  [
    routes.home(),
    routes.blogIndex(),
    routes.topics(),
    routes.tags(),
    routes.privacy(),
    routes.legal(),
    routes.cookieStatement(),
    routes.newsletterUnsubscribeConfirmation(),
    ...Object.values(NEWSLETTER_RESULT).map(routes.newsletterResult),
  ].map((path) => scoped(locale, path));

describe(buildTenantSitePaths, () => {
  it('builds the index, legal and newsletter paths in every locale', () => {
    const paths = buildTenantSitePaths({
      tenantId: MOCK_TENANT_ID,
      locales: [EN, NL],
      lists: mockTenantPageLists(),
    });

    expect(paths).toEqual([
      ...everyLanguagePaths(EN),
      ...everyLanguagePaths(NL),
    ]);
  });

  it('adds every listed page in its own language and blog pagination in every locale', () => {
    const paths = buildTenantSitePaths({
      tenantId: MOCK_TENANT_ID,
      locales: [EN, NL],
      lists: mockTenantPageLists({
        posts: [
          {
            slug: MOCK_POST_SLUG,
            language: NL,
            publishedAt: faker.date.past().toISOString(),
          },
        ],
        topics: [{ slug: MOCK_TOPIC_SLUG, language: EN }],
        topicPages: [{ slug: MOCK_TOPIC_SLUG, language: EN, page: MOCK_PAGE }],
        tags: [{ slug: MOCK_TAG_SLUG, language: NL }],
        tagPages: [{ slug: MOCK_TAG_SLUG, language: NL, page: MOCK_PAGE }],
        blogPages: [{ page: MOCK_PAGE }],
        landingPages: [{ slug: MOCK_LANDING_SLUG, language: EN }],
        privacyDocuments: [{ slug: MOCK_PRIVACY_SLUG, language: EN }],
        legalDocuments: [{ slug: MOCK_LEGAL_SLUG, language: NL }],
      }),
    });

    expect(paths).toEqual(
      expect.arrayContaining([
        scoped(EN, routes.blogIndex(Number(MOCK_PAGE))),
        scoped(NL, routes.blogIndex(Number(MOCK_PAGE))),
        scoped(NL, routes.post(MOCK_POST_SLUG)),
        scoped(EN, routes.topic(MOCK_TOPIC_SLUG)),
        scoped(EN, routes.topic(MOCK_TOPIC_SLUG, Number(MOCK_PAGE))),
        scoped(NL, routes.tag(MOCK_TAG_SLUG)),
        scoped(NL, routes.tag(MOCK_TAG_SLUG, Number(MOCK_PAGE))),
        scoped(EN, routes.landingPage(MOCK_LANDING_SLUG)),
        scoped(EN, routes.privacyDocument(MOCK_PRIVACY_SLUG)),
        scoped(NL, routes.legalDocument(MOCK_LEGAL_SLUG)),
      ]),
    );
    expect(paths).not.toContain(scoped(EN, routes.post(MOCK_POST_SLUG)));
  });

  it('adds a removed post’s path in every locale', () => {
    const paths = buildTenantSitePaths({
      tenantId: MOCK_TENANT_ID,
      locales: [EN, NL],
      lists: mockTenantPageLists(),
      removedPostSlug: MOCK_REMOVED_POST_SLUG,
    });

    expect(paths).toEqual(
      expect.arrayContaining([
        scoped(EN, routes.post(MOCK_REMOVED_POST_SLUG)),
        scoped(NL, routes.post(MOCK_REMOVED_POST_SLUG)),
      ]),
    );
  });

  it('returns no duplicate paths', () => {
    const paths = buildTenantSitePaths({
      tenantId: MOCK_TENANT_ID,
      locales: [EN, EN],
      lists: mockTenantPageLists(),
    });

    expect(paths).toEqual(everyLanguagePaths(EN));
  });
});
