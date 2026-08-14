import { tv } from 'tailwind-variants';

export const voiceSettingsVariants = tv({
  slots: {
    root: ['flex max-w-3xl flex-col gap-6'],
    pagehead: ['flex flex-wrap items-start justify-between gap-4'],
    description: ['mt-1 max-w-md text-sm text-text-muted'],
    basicCard: [
      'rounded-md border border-border bg-surface p-4',
      'flex flex-col gap-3',
    ],
    advanced: ['group rounded-lg border border-border bg-surface shadow-sm'],
    advancedSummary: [
      'flex cursor-pointer list-none items-center gap-2 p-4 text-sm font-semibold text-text',
      'marker:hidden [&::-webkit-details-marker]:hidden',
      'outline-hidden focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-primary',
    ],
    advancedSummaryIcon: [
      'text-text-subtle transition-transform duration-base ease-console group-open:rotate-90',
    ],
    advancedBody: ['flex flex-col gap-4 border-t border-border p-4'],
    alert: ['w-fit'],
  },
});
