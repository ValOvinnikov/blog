import { tagIndexPageSchema } from '@blog/studio/schema-types/documents/pages/tag-index/tag-index';
import { taxonomyListSchema } from '@blog/studio/schema-types/modules/taxonomy-list/taxonomy-list';
import { seoSchema } from '@blog/studio/schema-types/objects/seo/seo';
import {
  assertSatisfiesRequiredFields,
  type TExemptField,
} from '@blog/studio/testing/assert-satisfies-required-fields';
import { getRecordedBounds } from '@blog/studio/testing/create-mock-validation-rule';
import { getField } from '@blog/studio/testing/get-field';
import { createIfNotExists } from 'sanity/migrate';

import { PAGE_TAG_INDEX_ID, TAXONOMY_LIST_TAGS_ID } from './ids';

import migration from './index';

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

const TAG_INDEX_PAGE_HEADING_BLOCK_EXEMPTION: TExemptField[] = [
  {
    name: 'headingBlock',
    reason:
      'this migration writes the flat heading/supportingText fields directly on page_tagIndex, never a nested headingBlock',
  },
];

const anchorDoc = {
  _id: 'settings_site',
  _type: 'settings_site',
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  _rev: 'rev-1',
};

const taxonomyListPayload = {
  _id: TAXONOMY_LIST_TAGS_ID,
  _type: 'module_taxonomyList',
  title: 'Tag Index List',
  brandVariant: 'SECONDARY',
};
const pageTagIndexPayload = {
  _id: PAGE_TAG_INDEX_ID,
  _type: 'page_tagIndex',
  title: 'Tag Index Page',
  heading: 'Tags',
  supportingText: 'Browse every post by tag.',
  taxonomyList: { _type: 'reference', _ref: TAXONOMY_LIST_TAGS_ID },
  seo: { _type: 'seo', metaTitle: 'Browse every post by tag on the blog' },
};

const expectedMutations = [
  createIfNotExists(taxonomyListPayload),
  createIfNotExists(pageTagIndexPayload),
];

describe('seed-page-tag-index migration', () => {
  it('creates module_taxonomyList and page_tagIndex from a settings_site anchor', () => {
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

    expect(migration.migrate.document(anchorDoc)).toEqual(expectedMutations);
  });

  it('skips a drafts.settings_site anchor, so the pair is not created twice', () => {
    const draftAnchor = { ...anchorDoc, _id: 'drafts.settings_site' };

    expect(migration.migrate.document(draftAnchor)).toBeUndefined();
  });

  it('is idempotent — a second run against the same anchor returns the same createIfNotExists mutations', () => {
    expect(migration.migrate.document(anchorDoc)).toEqual(
      migration.migrate.document(anchorDoc),
    );
  });

  it('resolves the anchor id regardless of its own document id shape', () => {
    const differentlyIdAnchor = {
      ...anchorDoc,
      _id: 'provisioning.settings.site',
    };

    expect(migration.migrate.document(differentlyIdAnchor)).toEqual(
      expectedMutations,
    );
  });

  it('seeds a seo.metaTitle within the required length bounds', () => {
    const metaTitleLength = pageTagIndexPayload.seo.metaTitle.length;

    expect(metaTitleLength).toBeGreaterThanOrEqual(SEO_META_TITLE_MIN_LENGTH);
    expect(metaTitleLength).toBeLessThanOrEqual(SEO_META_TITLE_MAX_LENGTH);
  });
});
