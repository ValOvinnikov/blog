import { createTV } from 'tailwind-variants';

/**
 * Project-configured `tv`. Import this instead of `tv` from `tailwind-variants`.
 *
 * `tailwind-variants` runs `tailwind-merge` internally, whose default config has
 * no knowledge of our custom Tailwind theme. Without help it cannot tell a
 * custom text-<size> (`text-copy`, `text-meta`, …) apart from a custom
 * text-<color> (`text-accent-contrast`, `text-text`, …) — it lumps them into one
 * conflicting group and silently strips the color when both land on one element
 * (e.g. every primary Button lost its `text-accent-contrast`).
 *
 * Registering the custom font-size names in tailwind-merge's `font-size`
 * classGroup lets it classify `text-<size>` correctly, so text colors survive.
 *
 * Keep this list in sync with the semantic `--text-*` sizes in
 * `@blog/tailwind-config`'s `theme.css`. The standard scale
 * (xs/sm/base/lg/xl/2xl/3xl/4xl) is already known to tailwind-merge.
 */
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
      },
    },
  },
});
