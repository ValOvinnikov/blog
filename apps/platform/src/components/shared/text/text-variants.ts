import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

export const textVariants = tv({
  variants: {
    variant: {
      body: 'text-admin-text text-admin-13-5',
      muted: 'text-admin-muted text-admin-12-5',
      supporting: 'text-admin-muted text-admin-13-5',
      hint: 'text-admin-muted text-admin-12',
      meta: 'text-admin-muted text-admin-12',
    },
  },
  defaultVariants: { variant: 'body' },
});

export type TTextVariants = VariantProps<typeof textVariants>;
