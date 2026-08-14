import { tv } from 'tailwind-variants';

export const voiceSettingsVariants = tv({
  slots: {
    root: ['flex max-w-3xl flex-col gap-6'],
    pagehead: ['flex flex-wrap items-start justify-between gap-4'],
    title: ['font-display text-2xl font-semibold text-text'],
    description: ['mt-1 max-w-md text-sm text-text-muted'],
    basicCard: [
      'rounded-md border border-border bg-surface p-4',
      'flex flex-col gap-3',
    ],
    basicTitle: ['font-display text-sm font-semibold text-text'],
    advanced: ['flex flex-col gap-4'],
    advancedSummary: [
      'flex cursor-pointer list-none items-baseline gap-2 text-sm font-medium text-text',
      'marker:content-none',
    ],
    advancedTag: [
      'rounded-full bg-secondary px-2 py-0.5 text-label text-text-subtle',
    ],
    advancedBody: ['mt-4 flex flex-col gap-4'],
    alert: ['w-fit'],
  },
});
