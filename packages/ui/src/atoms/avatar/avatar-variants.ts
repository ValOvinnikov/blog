import { SIZE } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const avatarVariants = tv({
  base: [
    'rounded-full overflow-hidden inline-flex items-center justify-center',
    'bg-surface-2 text-text-muted',
    'font-display font-medium',
    'select-none shrink-0',
  ],
  variants: {
    size: {
      [SIZE.SM]: 'h-8 w-8 text-xs',
      [SIZE.MD]: 'h-10 w-10 text-sm',
      [SIZE.LG]: 'h-14 w-14 text-base',
    },
  },
  defaultVariants: {
    size: SIZE.MD,
  },
});

export const avatarImageVariants = tv({
  base: ['h-full w-full object-cover'],
});

export const avatarNameVariants = tv({
  base: ['sr-only'],
});

export type TAvatarVariants = VariantProps<typeof avatarVariants>;
