import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

export const textVariants = tv({
  variants: {
    variant: {
      body: 'text-platform-text text-platform-13-5',
      muted: 'text-platform-muted text-platform-12-5',
      supporting: 'text-platform-muted text-platform-13-5',
      hint: 'text-platform-muted text-platform-12',
      meta: 'text-platform-muted text-platform-12',
    },
  },
  defaultVariants: { variant: 'body' },
});

export type TTextVariants = VariantProps<typeof textVariants>;
