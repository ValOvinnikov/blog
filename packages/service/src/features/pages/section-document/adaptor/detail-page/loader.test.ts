import {
  CONTENT_ALIGNMENT,
  SANITY_CONTENT_REVALIDATE_SECONDS,
} from '@blog/config';
import { LEGAL_PAGE_KIND } from '@blog/config/constants';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { mockRawSectionDocumentDetail } from '@blog/service/testing/pages/fixtures';
import {
  MOCK_LINK_TARGET_CACHE_TAGS,
  MOCK_TOPIC_CACHE_TAG,
} from '@blog/service/testing/sanity/query/cache-tags';
import {
  mockRawHeadingBlock,
  mockRawSeo,
} from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getSectionDocument } from './loader';
import { sectionDocumentPageQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

faker.seed(6514);

const MOCK_ID = faker.string.uuid();
const MOCK_TITLE = faker.lorem.words(2);
const MOCK_SLUG = faker.lorem.slug();
const MOCK_META_TITLE = faker.lorem.words(4);
const MOCK_HEADING = faker.lorem.words(3);
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();

const tenant = mockTenant();

describe(getSectionDocument, () => {
  it('resolves undefined when no page matches', async () => {
    mockRun.mockResolvedValueOnce(null);

    const result = await getSectionDocument(
      'page_legalDocument',
      MOCK_SLUG,
      tenant,
    );

    expect(result).toBeUndefined();
  });

  it('maps the raw page into a document detail', async () => {
    mockRun.mockResolvedValueOnce(
      mockRawSectionDocumentDetail({
        _id: MOCK_ID,
        _type: 'page_legalDocument',
        title: MOCK_TITLE,
        slug: MOCK_SLUG,
        kind: LEGAL_PAGE_KIND.IMPRINT,
        seo: mockRawSeo({ metaTitle: MOCK_META_TITLE }),
      }),
    );

    const result = await getSectionDocument(
      'page_legalDocument',
      MOCK_SLUG,
      tenant,
    );

    expect(result).toMatchObject({
      id: MOCK_ID,
      type: 'page_legalDocument',
      title: MOCK_TITLE,
      slug: MOCK_SLUG,
      kind: LEGAL_PAGE_KIND.IMPRINT,
      body: [],
      seo: { title: MOCK_META_TITLE },
      translations: [],
    });
  });

  it('maps the heading block and its alignment', async () => {
    mockRun.mockResolvedValueOnce(
      mockRawSectionDocumentDetail({
        headingBlock: mockRawHeadingBlock(MOCK_HEADING, {
          supportingText: MOCK_SUPPORTING_TEXT,
        }),
        contentAlignment: CONTENT_ALIGNMENT.CENTER,
      }),
    );

    const result = await getSectionDocument(
      'page_privacyDocument',
      MOCK_SLUG,
      tenant,
    );

    expect(result).toMatchObject({
      headingBlock: {
        heading: MOCK_HEADING,
        supportingText: MOCK_SUPPORTING_TEXT,
      },
      headingAlignment: CONTENT_ALIGNMENT.CENTER,
    });
  });

  it('maps a page with no heading block to a left-aligned page without one', async () => {
    mockRun.mockResolvedValueOnce(mockRawSectionDocumentDetail());

    const result = await getSectionDocument(
      'page_legalDocument',
      MOCK_SLUG,
      tenant,
    );

    expect(result?.headingBlock).toBeUndefined();
    expect(result?.headingAlignment).toBe(CONTENT_ALIGNMENT.LEFT);
  });

  it('queries the section and slug for the tenant under every tag its links read', async () => {
    mockRun.mockResolvedValueOnce(null);

    await getSectionDocument('page_privacyDocument', MOCK_SLUG, tenant);

    expect(mockRun).toHaveBeenCalledWith(sectionDocumentPageQuery, {
      parameters: { type: 'page_privacyDocument', slug: MOCK_SLUG },
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [MOCK_TOPIC_CACHE_TAG, ...MOCK_LINK_TARGET_CACHE_TAGS],
      },
    });
  });
});
