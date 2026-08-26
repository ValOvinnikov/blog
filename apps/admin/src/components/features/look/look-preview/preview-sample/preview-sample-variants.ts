import { tv } from 'tailwind-variants';

/**
 * Every class here reads a SITE token (`--surface`, `--text`, `--border`,
 * …), not an `--admin-*` one — this box renders the tenant's own theme via
 * `tokenStyle`, so it must speak the site's vocabulary to actually preview
 * it. See `look-preview.tsx`'s doc comment for the admin/site token split.
 */
export const previewSampleVariants = tv({
  slots: {
    previewBox: ['rounded-lg border border-border bg-primary p-5'],
    // No base classes — carries only the conditional `dark` class below, for
    // WindowChrome (an external component whose own surface/border/text
    // classes already read `--surface`/`--border`/`--text`) so re-theming the
    // sample content only needs toggling this class, not restyling it.
    previewSurface: [],
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
        previewBox: ['dark'],
        previewSurface: ['dark'],
      },
      false: {},
    },
  },
});
