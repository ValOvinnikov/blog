import { tv } from '@blog/ui/lib/styling';

const SHEET_BELOW_LG = [
  'max-lg:fixed max-lg:inset-x-gutter max-lg:mt-0 max-lg:w-auto max-lg:max-w-none',
  'max-lg:top-[calc(var(--site-header-height,4.5rem)+0.5rem)]',
  'max-lg:max-h-[calc(100dvh-var(--site-header-height,4.5rem)-1rem)] max-lg:overflow-y-auto',
].join(' ');

export const authMenuVariants = tv({
  slots: {
    // A max-width alone is not enough: an absolute panel shrink-fits and wraps its items.
    panel: ['w-80 max-w-[calc(100vw-2rem)]', SHEET_BELOW_LG],
    // A sibling of the panel, never inside it: the closed panel is `hidden`, which would silence the alert on an OAuth redirect-back.
    errorNotice: [
      'absolute top-full left-0 z-20 mt-2 min-w-[220px]',
      'rounded-md border border-border bg-surface px-3 py-2 shadow-lg',
      'font-mono text-meta text-error',
      SHEET_BELOW_LG,
    ],
    slot: ['inline-flex shrink-0'],
    emptyOutline: ['[&>*]:invisible'],
    reveal: [
      'inline-flex shrink-0',
      'motion-safe:transition-opacity motion-safe:duration-fast motion-safe:starting:opacity-0',
    ],
    loadingStatus: ['sr-only'],
  },
});
