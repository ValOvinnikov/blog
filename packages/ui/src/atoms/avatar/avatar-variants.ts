import { tv } from 'tailwind-variants';

export const avatarVariants = tv({
  base: [
    'rounded-full overflow-hidden inline-flex items-center justify-center',
    'bg-surface-2 text-text-muted',
    'font-sans font-medium',
    'select-none shrink-0',
  ],
  variants: {
    size: {
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm',
      lg: 'h-14 w-14 text-base',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export const avatarImageVariants = tv({
  base: ['h-full w-full object-cover'],
});
