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

const FONT_DISPLAY = 'font-display';
const FONT_MONO = 'font-mono';
const FONT_HEADING = 'font-heading';
const PY_SECTION = 'py-section';
const PY_ZERO = 'py-0';
const TEXT_COPY = 'text-copy';
const TEXT_CONTRAST = 'text-brand-primary-contrast';

const customSizeTokens = tokensByCategory.typography
  .map(({ name }) => name)
  .filter((name) => !TAILWIND_BUILT_IN_SIZES.includes(name));

describe(tv, () => {
  it.each([
    { base: FONT_DISPLAY, added: FONT_MONO },
    { base: FONT_MONO, added: FONT_DISPLAY },
    { base: 'font-body', added: 'font-read' },
    { base: PY_SECTION, added: PY_ZERO },
    { base: 'tracking-tight', added: 'tracking-label' },
    { base: 'tracking-eyebrow', added: 'tracking-tight-card' },
    { base: FONT_HEADING, added: 'font-semibold' },
    { base: 'aspect-video', added: 'aspect-card' },
    { base: 'normal-case', added: 'heading-case' },
  ])('lets $added replace the conflicting $base', ({ base, added }) => {
    const styles = tv({ base });

    expect(styles({ class: added })).toBe(added);
  });

  it.each([
    {
      base: TEXT_COPY,
      added: TEXT_CONTRAST,
      merged: `${TEXT_COPY} ${TEXT_CONTRAST}`,
    },
    {
      base: TEXT_CONTRAST,
      added: TEXT_COPY,
      merged: `${TEXT_CONTRAST} ${TEXT_COPY}`,
    },
    {
      base: FONT_DISPLAY,
      added: FONT_HEADING,
      merged: `${FONT_DISPLAY} ${FONT_HEADING}`,
    },
    {
      base: `${PY_SECTION} px-gutter`,
      added: PY_ZERO,
      merged: `px-gutter ${PY_ZERO}`,
    },
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
