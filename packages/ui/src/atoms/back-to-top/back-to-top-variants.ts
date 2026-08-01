import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const backToTopVariants = tv({
  base: [
    'fixed right-6 bottom-6 z-20',
    'size-11 rounded-full',
    'border border-border bg-surface shadow-lg',
    'transition-[opacity,translate] duration-base ease-console',
  ],
  variants: {
    visible: {
      true: 'translate-y-0 opacity-100',
      false: 'pointer-events-none translate-y-2 opacity-0',
    },
  },
  defaultVariants: {
    visible: false,
  },
});

export type TBackToTopVariants = VariantProps<typeof backToTopVariants>;
