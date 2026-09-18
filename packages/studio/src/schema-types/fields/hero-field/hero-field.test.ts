import { heroField } from '@blog/studio/schema-types/fields/hero-field/hero-field';

describe(heroField, () => {
  it('builds a reference scoped to exactly the given allow list', () => {
    const field = heroField({ allow: ['module_heroBlog'] });

    expect(field.to).toEqual([{ type: 'module_heroBlog' }]);
  });

  it('preserves the caller-supplied order for multiple allowed hero types', () => {
    const field = heroField({
      allow: ['module_hero', 'module_heroBlog', 'module_heroStatement'],
    });

    expect(field.to).toEqual([
      { type: 'module_hero' },
      { type: 'module_heroBlog' },
      { type: 'module_heroStatement' },
    ]);
  });
});
