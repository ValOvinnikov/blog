import { createIfNotExists } from 'sanity/migrate';

import { PAGE_TAG_INDEX_ID, TAXONOMY_LIST_TAGS_ID } from './ids';

import migration from './index';

const anchorDoc = {
  _id: 'settings_site',
  _type: 'settings_site',
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  _rev: 'rev-1',
};

const expectedMutations = [
  createIfNotExists({
    _id: TAXONOMY_LIST_TAGS_ID,
    _type: 'module_taxonomyList',
    title: 'Tag Index List',
    brandVariant: 'SECONDARY',
  }),
  createIfNotExists({
    _id: PAGE_TAG_INDEX_ID,
    _type: 'page_tagIndex',
    title: 'Tag Index Page',
    heading: 'Tags',
    supportingText: 'Browse every post by tag.',
    taxonomyList: { _type: 'reference', _ref: TAXONOMY_LIST_TAGS_ID },
  }),
];

describe('seed-page-tag-index migration', () => {
  it('creates module_taxonomyList and page_tagIndex from a settings_site anchor', () => {
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
