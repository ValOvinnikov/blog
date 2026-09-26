import { tv } from '@blog/ui/lib/styling';

export const consentCategoryRowVariants = tv({
  slots: {
    root: [
      'flex items-start justify-between gap-4',
      'border-t border-border py-3 first:border-t-0',
    ],
    content: ['min-w-0 flex-1'],
    label: ['block font-mono text-copy font-medium text-text'],
    description: ['mt-1 text-card-copy text-subtle'],
    switchWrapper: [
      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full',
    ],
    input: ['peer sr-only'],
    track: [
      'absolute inset-0 rounded-full bg-border-strong transition-colors duration-base ease-smooth',
      'peer-checked:bg-brand-primary-solid',
      'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
      'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-primary',
      'peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-primary',
    ],
    thumb: [
      'absolute left-0.5 h-5 w-5 rounded-full bg-surface shadow-sm transition-transform duration-base ease-smooth',
      'peer-checked:translate-x-5',
      'peer-disabled:opacity-50',
    ],
  },
});
