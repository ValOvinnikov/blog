import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

export const textVariants = tv({
  variants: {
    variant: {
      body: 'text-admin-text',
      muted: 'text-admin-muted text-[12.5px]',
      supporting: 'text-admin-muted text-[13.5px]',
      hint: 'text-admin-faint text-xs',
    },
  },
  defaultVariants: { variant: 'body' },
});

export type TTextVariants = VariantProps<typeof textVariants>;
