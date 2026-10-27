import { TAXONOMY_KIND } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import { at, set } from 'sanity/migrate';

import { authorTaxonomyOnModule } from './author-taxonomy-on-module';

faker.seed(2);

const MOCK_LIST_ID = faker.string.uuid();
const MOCK_OTHER_LIST_ID = faker.string.uuid();
const REFERENCED_IDS = new Set([MOCK_LIST_ID]);

describe(authorTaxonomyOnModule, () => {
  it.each([
    ['no taxonomy field', { _id: MOCK_LIST_ID }],
    ['a null taxonomy', { _id: MOCK_LIST_ID, taxonomy: null }],
    ['a draft of the referenced id', { _id: `drafts.${MOCK_LIST_ID}` }],
  ])(
    'sets the given taxonomy kind on a referenced module with %s',
    (_label, doc) => {
      expect(
        authorTaxonomyOnModule(doc, REFERENCED_IDS, TAXONOMY_KIND.TOPICS),
      ).toEqual([at('taxonomy', set(TAXONOMY_KIND.TOPICS))]);
    },
  );

  it.each([TAXONOMY_KIND.TOPICS, TAXONOMY_KIND.TAGS])(
    'leaves an already-authored %s taxonomy untouched',
    (taxonomy) => {
      const doc = { _id: MOCK_LIST_ID, taxonomy };

      expect(
        authorTaxonomyOnModule(doc, REFERENCED_IDS, TAXONOMY_KIND.TOPICS),
      ).toBeUndefined();
    },
  );

  it('leaves a module no index page references untouched', () => {
    const doc = { _id: MOCK_OTHER_LIST_ID };

    expect(
      authorTaxonomyOnModule(doc, REFERENCED_IDS, TAXONOMY_KIND.TOPICS),
    ).toBeUndefined();
  });
});
