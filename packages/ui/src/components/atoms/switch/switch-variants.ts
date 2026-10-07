import { tv } from '@blog/ui/lib/styling';

export const switchVariants = tv({
  slots: {
    wrapper: [
      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full',
    ],
    input: ['peer sr-only'],
    track: [
      'absolute inset-0 rounded-full bg-border-strong transition-colors duration-base ease-smooth',
      'peer-checked:bg-brand-primary-solid',
      'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
      'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-primary',
      'peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-ambient',
    ],
    thumb: [
      'absolute left-0.5 h-5 w-5 rounded-full bg-surface shadow-sm transition-transform duration-base ease-smooth',
      'peer-checked:translate-x-5',
      'peer-disabled:opacity-50',
    ],
  },
});
