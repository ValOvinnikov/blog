import { tokensByCategory } from '@blog/ui/lib/design-tokens/token-registry';

import { tv } from './tv';

const TAILWIND_BUILT_IN_SIZES = [
  'xs',
  'sm',
  'base',
  'lg',
  'xl',
  '2xl',
  '3xl',
  '4xl',
];

const customSizeTokens = tokensByCategory.typography
  .map(({ name }) => name)
  .filter((name) => !TAILWIND_BUILT_IN_SIZES.includes(name));

describe(tv, () => {
  it.each([
    { base: 'font-display', added: 'font-mono', merged: 'font-mono' },
    { base: 'font-mono', added: 'font-display', merged: 'font-display' },
    { base: 'font-body', added: 'font-read', merged: 'font-read' },
    { base: 'py-section', added: 'py-0', merged: 'py-0' },
    {
      base: 'tracking-tight',
      added: 'tracking-label',
      merged: 'tracking-label',
    },
    {
      base: 'tracking-eyebrow',
      added: 'tracking-tight-card',
      merged: 'tracking-tight-card',
    },
  ])('lets $added replace the conflicting $base', ({ base, added, merged }) => {
    const styles = tv({ base });

    expect(styles({ class: added })).toBe(merged);
  });

  it.each([
    {
      base: 'text-copy',
      added: 'text-brand-primary-contrast',
      merged: 'text-copy text-brand-primary-contrast',
    },
    {
      base: 'text-brand-primary-contrast',
      added: 'text-copy',
      merged: 'text-brand-primary-contrast text-copy',
    },
    { base: 'py-section px-gutter', added: 'py-0', merged: 'px-gutter py-0' },
  ])(
    'keeps $added alongside the unrelated $base',
    ({ base, added, merged }) => {
      const styles = tv({ base });

      expect(styles({ class: added })).toBe(merged);
    },
  );

  it.each(customSizeTokens)(
    'keeps a text-<color> utility alongside the theme size text-%s',
    (name) => {
      const styles = tv({ base: 'text-text' });

      expect(styles({ class: `text-${name}` })).toBe(`text-text text-${name}`);
    },
  );
});
