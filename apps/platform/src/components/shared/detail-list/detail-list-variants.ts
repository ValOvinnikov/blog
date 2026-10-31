import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

export const detailListVariants = tv({
  slots: {
    root: [
      'grid grid-cols-1 items-baseline gap-x-3.5 gap-y-0.5',
      'text-admin-13-5 leading-5 text-admin-text',
    ],
    term: ['text-admin-12-5 leading-5 font-normal text-admin-muted'],
    description: ['m-0 flex min-w-0 flex-wrap items-center gap-2'],
    value: [
      'min-w-0 wrap-anywhere',
      'text-admin-13-5 leading-5 font-normal text-admin-text',
    ],
  },
  variants: {
    isMono: {
      true: { value: ['font-mono text-admin-12-5 leading-5 font-medium'] },
      false: {},
    },
    isStackedToLg: {
      true: {
        root: [
          'lg:grid-cols-[112px_minmax(0,1fr)] lg:gap-y-3',
          'max-lg:[&>dt:not(:first-child)]:mt-2.5',
        ],
      },
      false: {
        root: [
          'md:grid-cols-[112px_minmax(0,1fr)] md:gap-y-3',
          'max-md:[&>dt:not(:first-child)]:mt-2.5',
        ],
      },
    },
  },
  defaultVariants: {
    isMono: false,
    isStackedToLg: false,
  },
});

export type TDetailListVariants = VariantProps<typeof detailListVariants>;
