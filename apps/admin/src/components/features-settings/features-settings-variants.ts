import { tv } from 'tailwind-variants';

export const featuresSettingsVariants = tv({
  slots: {
    root: ['flex max-w-3xl flex-col gap-6'],
    pagehead: ['flex flex-wrap items-start justify-between gap-4'],
    description: ['mt-1 max-w-md text-sm text-text-muted'],
    alert: ['w-fit'],
    card: ['rounded-lg border border-border bg-surface shadow-sm'],
    toggleRow: ['flex flex-wrap items-center gap-3'],
    switchTrack: [
      'relative h-5 w-9 shrink-0 cursor-pointer rounded-full bg-secondary',
      'transition-colors duration-base ease-console',
      'data-[checked]:bg-brand-primary-solid',
      'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40',
      'outline-hidden focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-primary',
    ],
    switchThumb: [
      'absolute left-0.5 top-0.5 size-4 rounded-full bg-surface shadow',
      'transition-transform duration-base ease-console',
      'data-[checked]:translate-x-4',
    ],
    switchLabel: ['text-sm text-text'],
  },
});
