import { TAXONOMY_KIND } from '@blog/config/constants';
import { at, set } from 'sanity/migrate';

import { authorTaxonomyOnModule } from './author-taxonomy-on-module';

describe('authorTaxonomyOnModule', () => {
  it('sets taxonomy: TOPICS on a referenced module with no taxonomy field', () => {
    const doc = { _id: 'list-1' };

    expect(authorTaxonomyOnModule(doc, new Set(['list-1']))).toEqual([
      at('taxonomy', set(TAXONOMY_KIND.TOPICS)),
    ]);
  });

  it('sets taxonomy: TOPICS on a referenced module whose taxonomy is null', () => {
    const doc = { _id: 'list-1', taxonomy: null };

    expect(authorTaxonomyOnModule(doc, new Set(['list-1']))).toEqual([
      at('taxonomy', set(TAXONOMY_KIND.TOPICS)),
    ]);
  });

  it('matches a draft document against its canonical referenced id', () => {
    const doc = { _id: 'drafts.list-1' };

    expect(authorTaxonomyOnModule(doc, new Set(['list-1']))).toEqual([
      at('taxonomy', set(TAXONOMY_KIND.TOPICS)),
    ]);
  });

  it('leaves an already-authored taxonomy untouched', () => {
    const doc = { _id: 'list-1', taxonomy: TAXONOMY_KIND.TOPICS };

    expect(authorTaxonomyOnModule(doc, new Set(['list-1']))).toBeUndefined();
  });

  it('leaves an already-authored taxonomy set to the other kind untouched', () => {
    const doc = { _id: 'list-1', taxonomy: TAXONOMY_KIND.TAGS };

    expect(authorTaxonomyOnModule(doc, new Set(['list-1']))).toBeUndefined();
  });

  it('is a no-op for a module no index page references', () => {
    const doc = { _id: 'list-2' };

    expect(authorTaxonomyOnModule(doc, new Set(['list-1']))).toBeUndefined();
  });
});
