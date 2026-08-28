import { set } from 'sanity/migrate';

import migration from './index';

/** The `object()` node handler is the only piece of migration logic under test here. */
const objectHandler = migration.migrate.object;

if (!objectHandler) {
  throw new Error('Expected the migration to define an object() node handler.');
}

describe('rename-body-image-type migration wiring', () => {
  it('returns a set() operation for a legacy body image array item', () => {
    const node = { _type: 'imageWithAlt', _key: 'a1', alt: 'A description' };

    const result = objectHandler(node, ['body', { _key: 'a1' }]);

    expect(result).toEqual(set({ ...node, _type: 'bodyImage' }));
  });

  it('returns undefined for a node outside the body[] array scope', () => {
    const node = { _type: 'imageWithAlt', alt: 'Hero' };

    const result = objectHandler(node, ['heroImage']);

    expect(result).toBeUndefined();
  });

  it('is scoped to blog_post and module_content document types only', () => {
    expect(migration.documentTypes).toEqual(['blog_post', 'module_content']);
  });
});
