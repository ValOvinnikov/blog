import { at, setIfMissing, unset } from 'sanity/migrate';

import { migrateModuleAppearanceToLayout } from './index';

describe(migrateModuleAppearanceToLayout, () => {
  it('moves module_hero appearance onto layout (no containerWidth) and unsets appearance', () => {
    const result = migrateModuleAppearanceToLayout('module_hero', {
      appearance: {
        spacingTop: 'LG',
        spacingBottom: 'LG',
        containerWidth: 'WIDE',
        divider: true,
        align: 'START',
      },
    });

    expect(result).toEqual([
      at(
        'layout',
        setIfMissing({
          spacingTop: 'LG',
          spacingBottom: 'LG',
          dividerTop: true,
          dividerBottom: true,
        }),
      ),
      at('appearance', unset()),
    ]);
  });

  it('moves module_newsletter appearance onto layout including containerWidth', () => {
    const result = migrateModuleAppearanceToLayout('module_newsletter', {
      appearance: {
        spacingTop: 'LG',
        spacingBottom: 'LG',
        containerWidth: 'WIDE',
        divider: true,
      },
    });

    expect(result).toEqual([
      at(
        'layout',
        setIfMissing({
          spacingTop: 'LG',
          spacingBottom: 'LG',
          containerWidth: 'WIDE',
          dividerTop: true,
          dividerBottom: true,
        }),
      ),
      at('appearance', unset()),
    ]);
  });

  it('only unsets appearance when nothing worth copying remains (e.g. only align was set)', () => {
    const result = migrateModuleAppearanceToLayout('module_hero', {
      appearance: { align: 'START' },
    });

    expect(result).toEqual([at('appearance', unset())]);
  });

  it('is idempotent — a doc already migrated (layout set) is left alone', () => {
    const result = migrateModuleAppearanceToLayout('module_hero', {
      appearance: { spacingTop: 'LG' },
      layout: { spacingTop: 'LG' },
    });

    expect(result).toBeUndefined();
  });

  it('treats an explicit layout: null as not yet migrated and still produces a patch', () => {
    const result = migrateModuleAppearanceToLayout('module_hero', {
      appearance: { spacingTop: 'LG' },
      layout: null,
    });

    expect(result).toEqual([
      at('layout', setIfMissing({ spacingTop: 'LG' })),
      at('appearance', unset()),
    ]);
  });

  it('returns undefined for a doc with no appearance', () => {
    const result = migrateModuleAppearanceToLayout('module_newsletter', {});

    expect(result).toBeUndefined();
  });
});
