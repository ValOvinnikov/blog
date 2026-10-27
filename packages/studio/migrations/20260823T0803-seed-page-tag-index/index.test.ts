import { BRAND_VARIANT } from '@blog/config/constants';
import { tagIndexPageSchema } from '@blog/studio/schema-types/documents/pages/tag-index/tag-index';
import { taxonomyListSchema } from '@blog/studio/schema-types/modules/taxonomy-list/taxonomy-list';
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

import { PAGE_TAG_INDEX_ID, TAXONOMY_LIST_TAGS_ID } from './ids';

import migration from './index';

faker.seed(41);

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
  reason: 'this migration creates page_tagIndex with no template reference',
};

const TAG_INDEX_PAGE_HEADING_BLOCK_EXEMPTION: TExemptField[] = [
  PAGE_TEMPLATE_EXEMPTION,
  {
    name: 'headingBlock',
    reason:
      'this migration writes the flat heading/supportingText fields directly on page_tagIndex, never a nested headingBlock',
  },
];

const MOCK_ANCHOR_ID = faker.string.uuid();

const mockAnchorDoc = (fields: Record<string, unknown> = {}) => ({
  ...MOCK_SYSTEM_FIELDS,
  _id: MOCK_ANCHOR_ID,
  _type: 'settings_site',
  ...fields,
});

const taxonomyListPayload = {
  _id: TAXONOMY_LIST_TAGS_ID,
  _type: 'module_taxonomyList',
  title: 'Tag Index List',
  brandVariant: BRAND_VARIANT.SECONDARY,
};
const pageTagIndexPayload = {
  _id: PAGE_TAG_INDEX_ID,
  _type: 'page_tagIndex',
  title: 'Tag Index Page',
  heading: 'Tags',
  supportingText: 'Browse every post by tag.',
  taxonomyList: mockReference(TAXONOMY_LIST_TAGS_ID),
  seo: { _type: 'seo', metaTitle: 'Browse every post by tag on the blog' },
};

describe('seed-page-tag-index migration', () => {
  it('creates the taxonomy list and the tag index page', () => {
    assertSatisfiesRequiredFields(
      taxonomyListSchema,
      taxonomyListPayload,
      TAXONOMY_LIST_HEADING_BLOCK_EXEMPTION,
    );
    assertSatisfiesRequiredFields(
      tagIndexPageSchema,
      pageTagIndexPayload,
      TAG_INDEX_PAGE_HEADING_BLOCK_EXEMPTION,
    );

    expect(migration.migrate.document(mockAnchorDoc())).toEqual([
      createIfNotExists(taxonomyListPayload),
      createIfNotExists(pageTagIndexPayload),
    ]);
  });

  it('skips a draft anchor so the pair is not created twice', () => {
    const draftAnchor = mockAnchorDoc({ _id: `drafts.${MOCK_ANCHOR_ID}` });

    expect(migration.migrate.document(draftAnchor)).toBeUndefined();
  });

  it('returns the same createIfNotExists mutations on every run', () => {
    const firstRun = migration.migrate.document(mockAnchorDoc());
    const secondRun = migration.migrate.document(mockAnchorDoc());

    expect(secondRun).toEqual(firstRun);
  });

  it('seeds a seo.metaTitle within the required length bounds', () => {
    const metaTitleLength = pageTagIndexPayload.seo.metaTitle.length;

    expect(metaTitleLength).toBeGreaterThanOrEqual(SEO_META_TITLE_MIN_LENGTH);
    expect(metaTitleLength).toBeLessThanOrEqual(SEO_META_TITLE_MAX_LENGTH);
  });
});
