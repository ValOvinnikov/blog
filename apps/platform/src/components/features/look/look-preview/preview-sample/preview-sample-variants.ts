import { tv } from '@platform/utils/tv/tv';

/**
 * Every class here reads a site token rather than an `--admin-*` one, since
 * this box renders the tenant's theme through `tokenStyle`.
 */
export const previewSampleVariants = tv({
  slots: {
    root: [
      'flex flex-col gap-3 rounded-md border border-border bg-primary px-card-x py-card-y text-text',
    ],
    brandRow: ['flex items-center gap-2'],
    brandName: ['text-base font-semibold text-text'],
    actionsRow: ['flex flex-wrap items-center gap-2 pt-1'],
    chip: [
      'inline-flex items-center rounded-full border border-border px-2.5 py-1 text-xs text-text-muted',
    ],
    cards: ['grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2'],
    outlinedCard: ['sm:col-span-2'],
  },
  variants: {
    isDark: {
      // theme.css scopes its dark ramp to `.dark`, so the class must sit on the
      // element carrying the inline tenant tokens or its static values win.
      true: {
        root: ['dark'],
      },
      false: {},
    },
  },
});
