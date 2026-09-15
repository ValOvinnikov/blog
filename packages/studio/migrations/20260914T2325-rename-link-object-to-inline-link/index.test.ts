import { set } from 'sanity/migrate';

import migration from './index';

/** The `object()` node handler is the only piece of migration logic under test here. */
const objectHandler = migration.migrate.object;

if (!objectHandler) {
  throw new Error('Expected the migration to define an object() node handler.');
}

describe('rename-link-object-to-inline-link migration wiring', () => {
  it('returns a set() operation for a legacy inline link at a known path', () => {
    const node = { _type: 'link', label: 'See more', url: '/blog' };

    const result = objectHandler(node, ['secondaryAction']);

    expect(result).toEqual(set({ ...node, _type: 'inlineLink' }));
  });

  it('returns undefined for a node outside every known inline-link path', () => {
    const node = { _type: 'link', href: 'https://example.com' };

    const result = objectHandler(node, [
      'body',
      { _key: 'block1' },
      'markDefs',
      { _key: 'mark1' },
    ]);

    expect(result).toBeUndefined();
  });

  it('is scoped to settings_footer, settings_navigation, module_hero, and module_cta only', () => {
    expect(migration.documentTypes).toEqual([
      'settings_footer',
      'settings_navigation',
      'module_hero',
      'module_cta',
    ]);
  });
});
