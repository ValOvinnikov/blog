import { BRAND_VARIANT } from '@blog/config/constants';
import { tagPageSchema } from '@blog/studio/schema-types/documents/pages/tag/tag';
import { postListSchema } from '@blog/studio/schema-types/modules/post-list/post-list';
import { seoSchema } from '@blog/studio/schema-types/objects/seo/seo';
import {
  assertSatisfiesRequiredFields,
  type TExemptField,
} from '@blog/studio/testing/assert-satisfies-required-fields';
import { getRecordedBounds } from '@blog/studio/testing/create-mock-validation-rule';
import { getField } from '@blog/studio/testing/get-field';
import { mockReference } from '@blog/studio/testing/mock-documents';
import { MOCK_SYSTEM_FIELDS } from '@blog/studio/testing/mock-migration';
import { faker } from '@faker-js/faker';
import { createIfNotExists } from 'sanity/migrate';

import { toPageTagId, toTagPostListId } from './id';

import migration, { buildTagMetaTitle } from './index';

faker.seed(32);

const metaTitleBounds = getRecordedBounds(getField(seoSchema, 'metaTitle'));
const SEO_META_TITLE_MIN_LENGTH = metaTitleBounds.min!;
const SEO_META_TITLE_MAX_LENGTH = metaTitleBounds.max!;

const HEADING_BLOCK_EXEMPTION: TExemptField[] = [
  {
    name: 'headingBlock',
    reason:
      'this migration creates module_postList and page_tag with no heading field of any kind — nothing here to satisfy the required headingBlock',
  },
];

const PAGE_TEMPLATE_EXEMPTION: TExemptField = {
  name: 'template',
  reason: 'this migration creates page_tag with no template reference',
};

const TAG_ITEMS_PER_PAGE = 9;
const MOCK_TAG_ID = faker.string.uuid();
const MOCK_TAG_TITLE = faker.lorem.word();
const MOCK_TAG_SLUG = faker.lorem.slug();
const MOCK_SHORT_TITLE = 'A';
const MOCK_LONG_TITLE = 'A'.repeat(200);

const mockTagDoc = (fields: Record<string, unknown> = {}) => ({
  ...MOCK_SYSTEM_FIELDS,
  _id: MOCK_TAG_ID,
  _type: 'blog_tag',
  title: MOCK_TAG_TITLE,
  slug: { _type: 'slug', current: MOCK_TAG_SLUG },
  ...fields,
});

describe('seed-page-tag-for-existing-tags migration', () => {
  it('creates a post list and a tag page copying the tag slug', () => {
    const postListId = toTagPostListId(MOCK_TAG_ID);
    const postListPayload = {
      _id: postListId,
      _type: 'module_postList',
      title: `${MOCK_TAG_TITLE} Archive`,
      brandVariant: BRAND_VARIANT.SECONDARY,
      limit: TAG_ITEMS_PER_PAGE,
      pageSize: TAG_ITEMS_PER_PAGE,
      showImages: true,
    };
    const pageTagPayload = {
      _id: toPageTagId(MOCK_TAG_ID),
      _type: 'page_tag',
      title: `${MOCK_TAG_TITLE} Tag Page`,
      slug: { _type: 'slug', current: MOCK_TAG_SLUG },
      tag: mockReference(MOCK_TAG_ID),
      postList: mockReference(postListId),
      seo: {
        _type: 'seo',
        metaTitle: `Browse every post tagged "${MOCK_TAG_TITLE}" on the blog`,
      },
    };

    assertSatisfiesRequiredFields(
      postListSchema,
      postListPayload,
      HEADING_BLOCK_EXEMPTION,
    );
    assertSatisfiesRequiredFields(tagPageSchema, pageTagPayload, [
      ...HEADING_BLOCK_EXEMPTION,
      PAGE_TEMPLATE_EXEMPTION,
    ]);

    expect(migration.migrate.document(mockTagDoc())).toEqual([
      createIfNotExists(postListPayload),
      createIfNotExists(pageTagPayload),
    ]);
  });

  it('skips a draft tag so the pair is not created twice', () => {
    const draftDoc = mockTagDoc({ _id: `drafts.${MOCK_TAG_ID}` });

    expect(migration.migrate.document(draftDoc)).toBeUndefined();
  });

  it('returns the same createIfNotExists mutations on every run', () => {
    const firstRun = migration.migrate.document(mockTagDoc());
    const secondRun = migration.migrate.document(mockTagDoc());

    expect(secondRun).toEqual(firstRun);
  });
});

describe(buildTagMetaTitle, () => {
  it('stays within the bounds for a one-character tag title', () => {
    const metaTitle = buildTagMetaTitle(MOCK_SHORT_TITLE);

    expect(metaTitle.length).toBeGreaterThanOrEqual(SEO_META_TITLE_MIN_LENGTH);
    expect(metaTitle.length).toBeLessThanOrEqual(SEO_META_TITLE_MAX_LENGTH);
  });

  it('clamps a very long tag title to the ceiling', () => {
    const metaTitle = buildTagMetaTitle(MOCK_LONG_TITLE);

    expect(metaTitle.length).toBe(SEO_META_TITLE_MAX_LENGTH);
  });
});
