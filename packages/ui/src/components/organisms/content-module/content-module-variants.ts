import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const contentModuleVariants = tv({
  slots: {
    root: ['mt-[22px]'],
    body: ['max-w-measure', 'text-prose'],
  },
  variants: {
    wrapped: {
      true: {
        root: ['mt-0'],
      },
    },
  },
});

export type TContentModuleVariants = VariantProps<typeof contentModuleVariants>;
