import { PAGE_TAG_INDEX_ID, TAXONOMY_LIST_TAGS_ID } from './ids';

describe('seed-page-tag-index ids', () => {
  it('matches the page_tagIndex singleton Studio document id', () => {
    expect(PAGE_TAG_INDEX_ID).toBe('page_tagIndex');
  });

  it('is a fixed, non-empty id for the taxonomy list module', () => {
    expect(TAXONOMY_LIST_TAGS_ID).toBe('taxonomyList-tags');
  });
});
