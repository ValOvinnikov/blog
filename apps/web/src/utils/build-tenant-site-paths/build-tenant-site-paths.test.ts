import { LOCALE_ISO_CODES } from '@blog/config';
import { faker } from '@faker-js/faker';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { mockTenantPageLists } from '@web/testing/shared/tenant-page-lists/fixtures';

import { buildTenantSitePaths } from './build-tenant-site-paths';

faker.seed(7382);

const { EN, NL } = LOCALE_ISO_CODES;
const [
  MOCK_POST_SLUG,
  MOCK_TOPIC_SLUG,
  MOCK_TAG_SLUG,
  MOCK_LANDING_SLUG,
  MOCK_PRIVACY_SLUG,
  MOCK_LEGAL_SLUG,
] = faker.helpers.uniqueArray(faker.lorem.slug, 6) as [
  string,
  string,
  string,
  string,
  string,
  string,
];
const MOCK_DOCUMENT_HREF = `/${faker.lorem.slug()}`;
const EN_ROOT = `/${MOCK_TENANT_ID}/${EN}`;
const NL_ROOT = `/${MOCK_TENANT_ID}/${NL}`;

const everyLanguagePaths = (root: string): string[] => [
  root,
  `${root}/blog`,
  `${root}/blog/page/2`,
  `${root}/topics`,
  `${root}/tags`,
  `${root}/privacy`,
  `${root}/legal`,
  `${root}/legal/cookie-statement`,
  `${root}/newsletter/unsubscribe`,
  `${root}/newsletter/confirmed`,
  `${root}/newsletter/confirm-invalid`,
  `${root}/newsletter/confirm-unavailable`,
  `${root}/newsletter/confirm-failed`,
  `${root}/newsletter/unsubscribed`,
  `${root}/newsletter/unsubscribe-invalid`,
  `${root}/newsletter/unsubscribe-failed`,
];

describe(buildTenantSitePaths, () => {
  it('builds the index, legal and newsletter paths in every locale', () => {
    const paths = buildTenantSitePaths({
      tenantId: MOCK_TENANT_ID,
      locales: [EN, NL],
      lists: mockTenantPageLists(),
    });

    expect(paths).toEqual([
      ...everyLanguagePaths(EN_ROOT),
      ...everyLanguagePaths(NL_ROOT),
    ]);
  });

  it('adds every listed page in its own language, with the page after each last one', () => {
    const paths = buildTenantSitePaths({
      tenantId: MOCK_TENANT_ID,
      locales: [EN],
      lists: mockTenantPageLists({
        posts: [
          {
            slug: MOCK_POST_SLUG,
            language: NL,
            publishedAt: faker.date.past().toISOString(),
          },
        ],
        topics: [{ slug: MOCK_TOPIC_SLUG, language: EN }],
        topicPages: [{ slug: MOCK_TOPIC_SLUG, language: EN, page: '2' }],
        tags: [{ slug: MOCK_TAG_SLUG, language: NL }],
        blogPages: [{ page: '2' }],
        landingPages: [{ slug: MOCK_LANDING_SLUG, language: EN }],
        privacyDocuments: [{ slug: MOCK_PRIVACY_SLUG, language: EN }],
        legalDocuments: [{ slug: MOCK_LEGAL_SLUG, language: NL }],
      }),
    });

    expect(paths).toEqual(
      expect.arrayContaining([
        `${EN_ROOT}/blog/page/2`,
        `${EN_ROOT}/blog/page/3`,
        `${NL_ROOT}/blog/${MOCK_POST_SLUG}`,
        `${EN_ROOT}/topics/${MOCK_TOPIC_SLUG}`,
        `${EN_ROOT}/topics/${MOCK_TOPIC_SLUG}/page/2`,
        `${EN_ROOT}/topics/${MOCK_TOPIC_SLUG}/page/3`,
        `${NL_ROOT}/tags/${MOCK_TAG_SLUG}`,
        `${NL_ROOT}/tags/${MOCK_TAG_SLUG}/page/2`,
        `${EN_ROOT}/${MOCK_LANDING_SLUG}`,
        `${EN_ROOT}/privacy/${MOCK_PRIVACY_SLUG}`,
        `${NL_ROOT}/legal/${MOCK_LEGAL_SLUG}`,
      ]),
    );
    expect(paths).not.toContain(`${EN_ROOT}/blog/${MOCK_POST_SLUG}`);
  });

  it('adds the changed document’s own path in every locale', () => {
    const paths = buildTenantSitePaths({
      tenantId: MOCK_TENANT_ID,
      locales: [EN, NL],
      lists: mockTenantPageLists(),
      documentHref: MOCK_DOCUMENT_HREF,
    });

    expect(paths).toEqual(
      expect.arrayContaining([
        `${EN_ROOT}${MOCK_DOCUMENT_HREF}`,
        `${NL_ROOT}${MOCK_DOCUMENT_HREF}`,
      ]),
    );
  });

  it('returns no duplicate paths', () => {
    const paths = buildTenantSitePaths({
      tenantId: MOCK_TENANT_ID,
      locales: [EN, EN],
      lists: mockTenantPageLists(),
    });

    expect(paths).toEqual(everyLanguagePaths(EN_ROOT));
  });
});
