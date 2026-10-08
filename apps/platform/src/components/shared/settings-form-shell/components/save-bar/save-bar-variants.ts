import { tv } from '@platform/utils/tv/tv';

export const saveBarVariants = tv({
  slots: {
    root: [
      'sticky bottom-3 z-10 md:bottom-4',
      'flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between',
      'rounded-admin border p-3 shadow-admin-lg md:py-3 md:pr-3.5 md:pl-[18px]',
    ],
    summary: ['inline-flex flex-wrap items-center gap-2.5 text-[14px]'],
    dot: ['size-[9px] shrink-0 rounded-full bg-admin-warn'],
    count: ['font-semibold'],
    breakdown: ['text-admin-muted'],
    errorLink: [
      'text-admin-bad underline underline-offset-2',
      'rounded-admin-sm outline-hidden focus-visible:ring-2 focus-visible:ring-admin-brand',
    ],
    actions: ['grid grid-cols-2 gap-2 md:flex md:items-center'],
    shortcut: [
      'hidden md:inline',
      'rounded-admin-sm border border-admin-line px-1.5 py-0.5 font-mono text-[11px] text-admin-muted',
    ],
    button: ['min-h-11 justify-center md:min-h-0'],
  },
  variants: {
    hasErrors: {
      true: {
        root: ['border-admin-bad-line bg-admin-bad-weak text-admin-bad'],
      },
      false: {
        root: ['border-admin-line bg-admin-surface text-admin-text'],
      },
    },
  },
  defaultVariants: {
    hasErrors: false,
  },
});
