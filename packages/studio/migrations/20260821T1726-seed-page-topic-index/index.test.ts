import { BRAND_VARIANT } from '@blog/config/constants';
import { topicIndexPageSchema } from '@blog/studio/schema-types/documents/pages/topic-index/topic-index';
import { taxonomyListSchema } from '@blog/studio/schema-types/modules/taxonomy-list/taxonomy-list';
import { seoSchema } from '@blog/studio/schema-types/objects/seo/seo';
import {
  assertSatisfiesRequiredFields,
  type TExemptField,
} from '@blog/studio/testing/assert-satisfies-required-fields';
import { getRecordedBounds } from '@blog/studio/testing/create-mock-validation-rule';
import { getField } from '@blog/studio/testing/get-field';
import { MOCK_SYSTEM_FIELDS } from '@blog/studio/testing/mock-migration';
import { faker } from '@faker-js/faker';
import { createIfNotExists } from 'sanity/migrate';

import { PAGE_TOPIC_INDEX_ID, TAXONOMY_LIST_TOPICS_ID } from './ids';

import migration from './index';

faker.seed(16);

const metaTitleBounds = getRecordedBounds(getField(seoSchema, 'metaTitle'));
const SEO_META_TITLE_MIN_LENGTH = metaTitleBounds.min!;
const SEO_META_TITLE_MAX_LENGTH = metaTitleBounds.max!;

const TAXONOMY_LIST_HEADING_BLOCK_EXEMPTION: TExemptField[] = [
  {
    name: 'headingBlock',
    reason:
      'this migration seeds module_taxonomyList with only title and brandVariant — no heading of any kind — so there is nothing here to satisfy the required headingBlock',
  },
];

const PAGE_TEMPLATE_EXEMPTION: TExemptField = {
  name: 'template',
  reason: 'this migration creates page_topicIndex with no template reference',
};

const TOPIC_INDEX_PAGE_HEADING_BLOCK_EXEMPTION: TExemptField[] = [
  PAGE_TEMPLATE_EXEMPTION,
  {
    name: 'headingBlock',
    reason:
      'this migration writes the flat heading/supportingText fields directly on page_topicIndex, never a nested headingBlock',
  },
];

const MOCK_ANCHOR_ID = faker.string.uuid();

const anchorDoc = {
  ...MOCK_SYSTEM_FIELDS,
  _id: MOCK_ANCHOR_ID,
  _type: 'settings_site',
};

const taxonomyListPayload = {
  _id: TAXONOMY_LIST_TOPICS_ID,
  _type: 'module_taxonomyList',
  title: 'Topic Index List',
  brandVariant: BRAND_VARIANT.PRIMARY,
};
const pageTopicIndexPayload = {
  _id: PAGE_TOPIC_INDEX_ID,
  _type: 'page_topicIndex',
  title: 'Topic Index Page',
  heading: 'Topics',
  supportingText: 'Browse every post by topic.',
  taxonomyList: { _type: 'reference', _ref: TAXONOMY_LIST_TOPICS_ID },
  seo: { _type: 'seo', metaTitle: 'Browse every post by topic on the blog' },
};

describe('seed-page-topic-index migration', () => {
  it('creates module_taxonomyList and page_topicIndex from an anchor', () => {
    const result = migration.migrate.document(anchorDoc);

    expect(result).toEqual([
      createIfNotExists(taxonomyListPayload),
      createIfNotExists(pageTopicIndexPayload),
    ]);
  });

  it('seeds documents that satisfy their schemas required fields', () => {
    assertSatisfiesRequiredFields(
      taxonomyListSchema,
      taxonomyListPayload,
      TAXONOMY_LIST_HEADING_BLOCK_EXEMPTION,
    );
    assertSatisfiesRequiredFields(
      topicIndexPageSchema,
      pageTopicIndexPayload,
      TOPIC_INDEX_PAGE_HEADING_BLOCK_EXEMPTION,
    );
  });

  it('skips a draft anchor so the pair is not created twice', () => {
    const draftAnchor = { ...anchorDoc, _id: `drafts.${MOCK_ANCHOR_ID}` };

    const result = migration.migrate.document(draftAnchor);

    expect(result).toBeUndefined();
  });

  it('seeds a seo.metaTitle within the required length bounds', () => {
    const metaTitleLength = pageTopicIndexPayload.seo.metaTitle.length;

    expect(metaTitleLength).toBeGreaterThanOrEqual(SEO_META_TITLE_MIN_LENGTH);
    expect(metaTitleLength).toBeLessThanOrEqual(SEO_META_TITLE_MAX_LENGTH);
  });
});
