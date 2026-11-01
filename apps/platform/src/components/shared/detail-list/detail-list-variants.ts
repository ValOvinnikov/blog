import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

export const detailListVariants = tv({
  slots: {
    root: ['group/detail-list text-admin-13-5 leading-5 text-admin-text'],
    row: [
      'contents',
      'group-data-bordered/detail-list:flex group-data-bordered/detail-list:min-h-13 group-data-bordered/detail-list:items-center group-data-bordered/detail-list:gap-4',
      'group-data-bordered/detail-list:border-b group-data-bordered/detail-list:border-admin-line-2 group-data-bordered/detail-list:first:border-t',
    ],
    term: [
      'text-admin-12-5 leading-5 font-normal text-admin-muted',
      'group-data-bordered/detail-list:w-30 group-data-bordered/detail-list:flex-none group-data-bordered/detail-list:text-admin-13',
    ],
    description: [
      'm-0 flex min-w-0 flex-wrap items-center gap-2',
      'group-data-bordered/detail-list:flex-1 group-data-bordered/detail-list:flex-nowrap group-data-bordered/detail-list:py-1',
    ],
    value: [
      'min-w-0 wrap-anywhere',
      'text-admin-13-5 leading-5 font-normal text-admin-text',
      'group-data-bordered/detail-list:text-admin-14 group-data-bordered/detail-list:font-medium',
    ],
  },
  variants: {
    isMono: {
      true: { value: ['font-mono text-admin-12-5 leading-5 font-medium'] },
      false: {},
    },
    isStackedToLg: {
      true: {},
      false: {},
    },
    isBordered: {
      true: { root: ['m-0 flex flex-col'] },
      false: {
        root: ['grid grid-cols-1 items-baseline gap-x-3.5 gap-y-0.5'],
      },
    },
  },
  compoundVariants: [
    {
      isBordered: false,
      isStackedToLg: true,
      class: {
        root: [
          'lg:grid-cols-[112px_minmax(0,1fr)] lg:gap-y-3',
          'max-lg:[&>div:not(:first-child)>dt]:mt-2.5',
        ],
      },
    },
    {
      isBordered: false,
      isStackedToLg: false,
      class: {
        root: [
          'md:grid-cols-[112px_minmax(0,1fr)] md:gap-y-3',
          'max-md:[&>div:not(:first-child)>dt]:mt-2.5',
        ],
      },
    },
  ],
  defaultVariants: {
    isMono: false,
    isStackedToLg: false,
    isBordered: false,
  },
});

export type TDetailListVariants = VariantProps<typeof detailListVariants>;
