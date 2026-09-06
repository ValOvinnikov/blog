import { tv } from '@platform/utils/tv/tv';

/**
 * Every class here reads a SITE token (`--surface`, `--text`, `--border`,
 * …), not an `--admin-*` one — this box renders the tenant's own theme via
 * `tokenStyle`, so it must speak the site's vocabulary to actually preview
 * it. See `look-preview.tsx`'s doc comment for the admin/site token split.
 */
export const previewSampleVariants = tv({
  slots: {
    // No base classes — `Panel` (an external component whose own
    // surface/border/text classes already read `--surface`/`--border`/
    // `--text`) supplies the visible surface; this slot carries only the
    // conditional `dark` class below, needed because those tokens are
    // scoped to a `.dark` ancestor rather than `prefers-color-scheme`.
    surface: [],
    brandRow: ['flex items-center gap-2'],
    brandName: ['text-base font-semibold text-text'],
    actionsRow: ['flex flex-wrap items-center gap-2 pt-1'],
    chip: [
      'inline-flex items-center rounded-full border border-border px-2.5 py-1 text-xs text-text-muted',
    ],
  },
  variants: {
    isDark: {
      true: {
        surface: ['dark'],
      },
      false: {},
    },
  },
});
