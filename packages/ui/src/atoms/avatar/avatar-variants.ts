import { Size } from '@blog/config';
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
      [Size.SM]: 'h-8 w-8 text-xs',
      [Size.MD]: 'h-10 w-10 text-sm',
      [Size.LG]: 'h-14 w-14 text-base',
    },
  },
  defaultVariants: {
    size: Size.MD,
  },
});

export const avatarImageVariants = tv({
  base: ['h-full w-full object-cover'],
});
