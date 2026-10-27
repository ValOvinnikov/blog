import { BRAND_VARIANT } from '@blog/config/constants';
import { topicPageSchema } from '@blog/studio/schema-types/documents/pages/topic/topic';
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

import { toPageTopicId, toTopicPostListId } from './id';

import migration, { buildTopicMetaTitle } from './index';

faker.seed(22);

const metaTitleBounds = getRecordedBounds(getField(seoSchema, 'metaTitle'));
const SEO_META_TITLE_MIN_LENGTH = metaTitleBounds.min!;
const SEO_META_TITLE_MAX_LENGTH = metaTitleBounds.max!;

const HEADING_BLOCK_EXEMPTION: TExemptField[] = [
  {
    name: 'headingBlock',
    reason:
      'this migration creates module_postList and page_topic with no heading field of any kind — nothing here to satisfy the required headingBlock',
  },
];

const PAGE_TEMPLATE_EXEMPTION: TExemptField = {
  name: 'template',
  reason: 'this migration creates page_topic with no template reference',
};

const TOPIC_ITEMS_PER_PAGE = 9;
const MOCK_TOPIC_ID = faker.string.uuid();
const MOCK_TOPIC_TITLE = faker.lorem.word();
const MOCK_TOPIC_SLUG = faker.lorem.slug();
const MOCK_SHORT_TITLE = 'A';
const MOCK_LONG_TITLE = 'A'.repeat(200);

const mockTopicDoc = (fields: Record<string, unknown> = {}) => ({
  ...MOCK_SYSTEM_FIELDS,
  _id: MOCK_TOPIC_ID,
  _type: 'blog_topic',
  title: MOCK_TOPIC_TITLE,
  slug: { _type: 'slug', current: MOCK_TOPIC_SLUG },
  ...fields,
});

describe('seed-page-topic-for-existing-topic migration', () => {
  it('creates a post list and a topic page copying the topic slug', () => {
    const postListId = toTopicPostListId(MOCK_TOPIC_ID);
    const postListPayload = {
      _id: postListId,
      _type: 'module_postList',
      title: `${MOCK_TOPIC_TITLE} Archive`,
      brandVariant: BRAND_VARIANT.PRIMARY,
      limit: TOPIC_ITEMS_PER_PAGE,
      pageSize: TOPIC_ITEMS_PER_PAGE,
      showImages: true,
    };
    const pageTopicPayload = {
      _id: toPageTopicId(MOCK_TOPIC_ID),
      _type: 'page_topic',
      title: `${MOCK_TOPIC_TITLE} Topic Page`,
      slug: { _type: 'slug', current: MOCK_TOPIC_SLUG },
      topic: mockReference(MOCK_TOPIC_ID),
      postList: mockReference(postListId),
      seo: {
        _type: 'seo',
        metaTitle: `Browse every post about "${MOCK_TOPIC_TITLE}" on the blog`,
      },
    };

    assertSatisfiesRequiredFields(
      postListSchema,
      postListPayload,
      HEADING_BLOCK_EXEMPTION,
    );
    assertSatisfiesRequiredFields(topicPageSchema, pageTopicPayload, [
      ...HEADING_BLOCK_EXEMPTION,
      PAGE_TEMPLATE_EXEMPTION,
    ]);

    expect(migration.migrate.document(mockTopicDoc())).toEqual([
      createIfNotExists(postListPayload),
      createIfNotExists(pageTopicPayload),
    ]);
  });

  it('skips a draft topic so the pair is not created twice', () => {
    const draftDoc = mockTopicDoc({ _id: `drafts.${MOCK_TOPIC_ID}` });

    expect(migration.migrate.document(draftDoc)).toBeUndefined();
  });

  it('returns the same createIfNotExists mutations on every run', () => {
    const firstRun = migration.migrate.document(mockTopicDoc());
    const secondRun = migration.migrate.document(mockTopicDoc());

    expect(secondRun).toEqual(firstRun);
  });
});

describe(buildTopicMetaTitle, () => {
  it('stays within the bounds for a one-character topic title', () => {
    const metaTitle = buildTopicMetaTitle(MOCK_SHORT_TITLE);

    expect(metaTitle.length).toBeGreaterThanOrEqual(SEO_META_TITLE_MIN_LENGTH);
    expect(metaTitle.length).toBeLessThanOrEqual(SEO_META_TITLE_MAX_LENGTH);
  });

  it('clamps a very long topic title to the ceiling', () => {
    const metaTitle = buildTopicMetaTitle(MOCK_LONG_TITLE);

    expect(metaTitle.length).toBe(SEO_META_TITLE_MAX_LENGTH);
  });
});
