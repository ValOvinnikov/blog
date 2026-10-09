import { tv } from '@platform/utils/tv/tv';

/**
 * Every class here reads a site token rather than an `--admin-*` one, since
 * this box renders the tenant's theme through `tokenStyle`.
 */
export const voiceSpecimenVariants = tv({
  slots: {
    root: [
      'rounded-md border border-border bg-primary px-card-x py-card-y font-read text-[1rem] text-text shadow-card',
    ],
    page: ['flex flex-col items-center gap-5 py-6 text-center'],
    copy: ['max-w-copy mx-auto'],
    actions: ['flex flex-wrap items-center justify-center gap-3'],
    listPage: ['flex flex-col gap-3'],
    emptyMessage: ['text-copy text-muted'],
    bookmarksPage: ['flex flex-col gap-4'],
  },
  variants: {
    isDark: {
      // theme.css scopes its dark ramp to `.dark`, so the class must sit on the
      // element carrying the inline tenant tokens or its static values win.
      true: { root: ['dark'] },
      false: {},
    },
  },
});
