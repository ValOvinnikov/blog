import { createTV } from 'tailwind-variants';

/** Registers this project's custom Tailwind token names (font sizes, font families, spacing, tracking) with tailwind-merge's classGroups so it can tell them apart instead of silently dropping a conflicting class. */
const SPACING_TOKENS = [
  'gutter',
  'section',
  'page-y',
  'site-x',
  'site-y',
  'card-x',
  'card-y',
];

const TRACKING_TOKENS = [
  'tight-display',
  'tight-hero',
  'tight-card',
  'label',
  'eyebrow',
  'section',
];

export const tv = createTV({
  twMergeConfig: {
    extend: {
      classGroups: {
        'font-size': [
          {
            text: [
              'display',
              'hero',
              'title-xl',
              'title-2xl',
              'title-3xl',
              'post-title',
              'prose',
              'lead',
              'caption',
              'copy',
              'card-title',
              'card-copy',
              'meta',
              'label',
              'code',
            ],
          },
        ],
        'font-family': [
          {
            font: ['display', 'body', 'read', 'mono'],
          },
        ],
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
