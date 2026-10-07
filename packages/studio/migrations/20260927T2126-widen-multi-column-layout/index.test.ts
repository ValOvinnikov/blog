import { set } from 'sanity/migrate';

import migration from './index';

const objectHandler = migration.migrate.object;

if (!objectHandler) {
  throw new Error('Expected the migration to define an object() node handler.');
}

describe('widen-multi-column-layout migration wiring', () => {
  let node: { _type: string; spacingTop: string };

  beforeEach(() => {
    node = { _type: 'layout', spacingTop: 'MD' };
  });

  it('returns a set() operation for a legacy layout field', () => {
    const result = objectHandler(node, ['layout']);

    expect(result).toEqual(set({ ...node, _type: 'wideLayout' }));
  });

  it('returns undefined for a node outside the layout field path', () => {
    const result = objectHandler(node, ['heroImage']);

    expect(result).toBeUndefined();
  });

  it('is scoped to the eleven multi-column module document types only', () => {
    expect(migration.documentTypes).toEqual([
      'module_featureHighlights',
      'module_featureList',
      'module_postFeatured',
      'module_postLatest',
      'module_postList',
      'module_postRelated',
      'module_pricing',
      'module_stats',
      'module_taxonomyList',
      'module_team',
      'module_testimonial',
    ]);
  });
});
