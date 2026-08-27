import { createTV } from 'tailwind-variants';

/**
 * Project-configured `tv`. Import this instead of `tv` from `tailwind-variants`.
 *
 * `tailwind-merge`'s default config doesn't know admin's custom `--text-*`
 * font-size scale (`text-label`, `text-meta`, …, defined in
 * `@blog/tailwind-config`'s `theme.css`), so it misclassifies a bare
 * `text-<size>` as a text-*color* utility and drops it when a real color
 * class lands in the same slot. See `packages/ui/src/lib/styling/tv.ts` for
 * the full history of this bug class in the sibling design system — admin
 * hit the same landmine after #2130 separated it from that wrapper.
 *
 * Keep these lists in sync with `@blog/tailwind-config`'s `theme.css`.
 */
const FONT_SIZE_TOKENS = [
  'display',
  'hero',
  'title-xl',
  'title-2xl',
  'title-3xl',
  'post-title',
  'prose-h2',
  'prose-h3',
  'prose-h4',
  'prose',
  'lead',
  'caption',
  'copy',
  'card-title',
  'card-copy',
  'meta',
  'label',
  'code',
];

const FONT_FAMILY_TOKENS = ['display', 'body', 'read', 'mono', 'ui'];

const TRACKING_TOKENS = [
  'tight-display',
  'tight-hero',
  'tight-card',
  'label',
  'eyebrow',
  'section',
];

const SPACING_TOKENS = [
  'gutter',
  'section',
  'page-y',
  'site-x',
  'site-y',
  'card-x',
  'card-y',
];

export const tv = createTV({
  twMergeConfig: {
    extend: {
      classGroups: {
        'font-size': [{ text: FONT_SIZE_TOKENS }],
        'font-family': [{ font: FONT_FAMILY_TOKENS }],
        tracking: [{ tracking: TRACKING_TOKENS }],
        p: [{ p: SPACING_TOKENS }],
        px: [{ px: SPACING_TOKENS }],
        py: [{ py: SPACING_TOKENS }],
        pt: [{ pt: SPACING_TOKENS }],
        pr: [{ pr: SPACING_TOKENS }],
        pb: [{ pb: SPACING_TOKENS }],
        pl: [{ pl: SPACING_TOKENS }],
      },
    },
  },
});
