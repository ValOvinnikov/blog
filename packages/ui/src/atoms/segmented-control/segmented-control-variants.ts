import { tv } from '@blog/ui/lib/styling';

export const segmentedControlVariants = tv({
  slots: {
    root: [
      'inline-flex items-center gap-0.5',
      'rounded-sm border border-border bg-surface p-0.5',
    ],
    option: [
      'inline-flex items-center justify-center',
      'rounded-sm px-3 py-1.5',
      'font-mono text-xs font-medium uppercase tracking-eyebrow',
      'cursor-pointer transition-colors duration-base ease-console',
      'text-muted hover:text-text',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-primary',
      'disabled:pointer-events-none disabled:opacity-50',
    ],
  },
  variants: {
    selected: {
      true: {
        option: [
          'bg-brand-primary-solid text-brand-primary-contrast hover:text-brand-primary-contrast',
        ],
      },
    },
  },
});
