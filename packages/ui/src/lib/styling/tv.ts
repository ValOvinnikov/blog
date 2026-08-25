import { createTV } from 'tailwind-variants';

/**
 * Project-configured `tv`. Import this instead of `tv` from `tailwind-variants`.
 *
 * `tailwind-variants` runs `tailwind-merge` internally, whose default config has
 * no knowledge of our custom Tailwind theme. Without help it cannot tell a
 * custom text-<size> (`text-copy`, `text-meta`, …) apart from a custom
 * text-<color> (`text-brand-primary-contrast`, `text-text`, …) — it lumps them into one
 * conflicting group and silently strips the color when both land on one element
 * (e.g. every primary Button lost its `text-brand-primary-contrast`).
 *
 * Registering the custom font-size names in tailwind-merge's `font-size`
 * classGroup lets it classify `text-<size>` correctly, so text colors survive.
 *
 * Keep this list in sync with the semantic `--text-*` sizes in
 * `@blog/tailwind-config`'s `theme.css`. The standard scale
 * (xs/sm/base/lg/xl/2xl/3xl/4xl) is already known to tailwind-merge.
 *
 * The custom `font-<family>` utilities (`font-display`, `font-body`,
 * `font-read`, `font-mono`, defined as `--font-*` theme tokens in
 * `theme.css`) are registered here too, for the same reason as the
 * font-size list above. Note: as of `tailwind-merge@3.6.0`, its default
 * `font-family` classGroup already has a permissive catch-all
 * (`isAnyNonArbitrary`) that happens to resolve conflicts between these
 * correctly without explicit registration — verified directly against a
 * stock `extendTailwindMerge({})`. Registering them explicitly is still
 * worthwhile as documented intent (matching the font-size precedent) and a
 * guard against that upstream catch-all narrowing in a future version, not
 * because it fixes an observed break in the currently pinned version.
 *
 * The custom `--spacing-*` tokens (`gutter`, `section`, `page-y`, `site-x`,
 * `site-y`, `card-x`, `card-y`, defined in `theme.css`) are registered
 * against every padding classGroup (`p`, `px`, `py`, `pt`, `pr`, `pb`, `pl`)
 * for the same reason, but this one *does* fix an observed break: unlike
 * `font-family`, `tailwind-merge`'s padding classGroups have no catch-all,
 * so `py-section` and `py-0` were classified as non-conflicting and both
 * landed on the element (`CtaModule`'s `wrapped` variant), leaving the
 * winner up to stylesheet order instead of `tv()`'s override intent.
 *
 * The custom `--tracking-*` tokens (`tight-display`, `tight-hero`,
 * `tight-card`, `label`, `eyebrow`, `section`, defined in `theme.css`) are
 * registered against the `tracking` classGroup for the same reason as
 * padding: without it, a caller-supplied `tracking-label` and a base
 * `tracking-tight` both survive on the same element (no catch-all,
 * unrecognized names don't conflict), leaving the winner to stylesheet
 * order instead of `tv()`'s override intent — surfaced by `Heading`
 * consumers overriding its default letter-spacing via `className`.
 */
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
