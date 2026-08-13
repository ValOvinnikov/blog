import { tv } from '@blog/ui/lib/styling';

export const switchShellVariants = tv({
  slots: {
    root: [
      'group relative inline-flex h-6 w-11 shrink-0 items-center',
      'rounded-full bg-secondary p-0.5',
      'cursor-pointer transition-colors duration-base ease-console',
      'data-[checked]:bg-brand-primary-solid',
      'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-primary',
    ],
    thumb: [
      'pointer-events-none block h-5 w-5 rounded-full bg-surface shadow-sm',
      'transition-transform duration-base ease-console',
      'group-data-[checked]:translate-x-5',
    ],
  },
});
