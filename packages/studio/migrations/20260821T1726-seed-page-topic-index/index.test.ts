import { topicIndexPageSchema } from '@blog/studio/schema-types/documents/pages/topic-index-page';
import { taxonomyListSchema } from '@blog/studio/schema-types/modules/module-taxonomy-list';
import { assertSatisfiesRequiredFields } from '@blog/studio/testing/assert-satisfies-required-fields';
import { createIfNotExists } from 'sanity/migrate';

import { PAGE_TOPIC_INDEX_ID, TAXONOMY_LIST_TOPICS_ID } from './ids';

import migration from './index';

const anchorDoc = {
  _id: 'settings_site',
  _type: 'settings_site',
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  _rev: 'rev-1',
};

const taxonomyListPayload = {
  _id: TAXONOMY_LIST_TOPICS_ID,
  _type: 'module_taxonomyList',
  title: 'Topic Index List',
  brandVariant: 'PRIMARY',
};
const pageTopicIndexPayload = {
  _id: PAGE_TOPIC_INDEX_ID,
  _type: 'page_topicIndex',
  title: 'Topic Index Page',
  heading: 'Topics',
  supportingText: 'Browse every post by topic.',
  taxonomyList: { _type: 'reference', _ref: TAXONOMY_LIST_TOPICS_ID },
};

const expectedMutations = [
  createIfNotExists(taxonomyListPayload),
  createIfNotExists(pageTopicIndexPayload),
];

describe('seed-page-topic-index migration', () => {
  it('creates module_taxonomyList and page_topicIndex from a settings_site anchor', () => {
    assertSatisfiesRequiredFields(taxonomyListSchema, taxonomyListPayload);
    assertSatisfiesRequiredFields(topicIndexPageSchema, pageTopicIndexPayload);

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
});
