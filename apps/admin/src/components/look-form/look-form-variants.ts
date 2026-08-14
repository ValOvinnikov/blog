import { tv } from 'tailwind-variants';

export const lookFormVariants = tv({
  slots: {
    root: ['flex flex-col gap-6'],
    pageHead: ['flex flex-wrap items-start justify-between gap-4'],
    pageHeadText: ['min-w-0'],
    actions: ['flex items-center gap-2'],
    grid: ['grid grid-cols-1 items-start gap-6 lg:grid-cols-2'],
    stack: ['flex flex-col gap-6'],
    card: ['rounded-lg border border-border bg-surface shadow-sm'],
    cardHead: [
      'flex flex-wrap items-baseline gap-2 border-b border-border p-4',
    ],
    cardHeadDesc: ['text-sm text-text-subtle'],
    cardBody: ['flex flex-col gap-5 p-4'],
    optionalTag: [
      'ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs font-normal text-text-subtle',
    ],
    disclosure: ['group rounded-lg border border-border bg-surface shadow-sm'],
    summary: [
      'flex cursor-pointer list-none items-center gap-2 p-4 text-sm font-semibold text-text',
      'marker:hidden [&::-webkit-details-marker]:hidden',
      'outline-hidden focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-primary',
    ],
    summaryIcon: [
      'text-text-subtle transition-transform duration-base ease-console group-open:rotate-90',
    ],
    disclosureBody: ['flex flex-col gap-5 border-t border-border p-4'],
    hueField: ['flex items-center gap-3'],
    swatch: ['size-10 shrink-0 rounded-md ring-1 ring-inset ring-border'],
    hueValue: ['w-16 shrink-0 font-mono text-meta text-text-subtle'],
    switchRow: ['flex items-center gap-2.5 text-sm text-text'],
    switchTrack: [
      'relative h-6 w-11 shrink-0 cursor-pointer rounded-full bg-secondary',
      'transition-colors duration-base ease-console',
      'data-[checked]:bg-brand-primary-solid',
      'outline-hidden focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-primary',
    ],
    switchThumb: [
      'block size-5 translate-x-0.5 rounded-full bg-surface shadow',
      'transition-transform duration-base ease-console',
      'data-[checked]:translate-x-[22px]',
    ],
    note: ['text-xs text-text-subtle'],
    uploads: ['grid grid-cols-1 gap-3 sm:grid-cols-2'],
  },
});
