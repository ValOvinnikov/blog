import { tv } from '@blog/ui/lib/styling';

export const brandLockupRootVariants = tv({
  base: ['inline-flex items-center gap-2'],
});

export const brandLockupTextVariants = tv({
  base: ['flex flex-col justify-center leading-none'],
});

export const brandLockupWordmarkVariants = tv({
  base: [
    'sr-only sm:not-sr-only sm:inline-block',
    'font-display text-lg font-medium tracking-tight',
    'text-text',
  ],
});

export const brandLockupSpecLineVariants = tv({
  base: ['hidden md:block', 'font-mono text-label', 'text-text-subtle'],
});
