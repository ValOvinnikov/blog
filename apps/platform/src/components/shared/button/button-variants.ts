import { SIZE } from '@blog/config';
import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

const STYLED_VARIANTS: ('primary' | 'secondary' | 'ghost' | 'danger')[] = [
  'primary',
  'secondary',
  'ghost',
  'danger',
];

export const buttonVariants = tv({
  slots: {
    root: [],
    srOnlyStatus: ['sr-only'],
  },
  variants: {
    variant: {
      primary: {
        root: ['border-admin-brand bg-admin-brand text-white shadow-admin'],
      },
      secondary: {
        root: [
          'border-admin-control-line bg-admin-surface text-admin-text shadow-admin hover:bg-admin-surface-2',
        ],
      },
      ghost: {
        root: [
          'border-transparent bg-transparent text-admin-text hover:bg-admin-line-2',
        ],
      },
      danger: {
        root: [
          'border-admin-bad-line bg-admin-bad-weak text-admin-bad shadow-admin',
        ],
      },
      unstyled: {
        root: [],
      },
    },
    size: {
      [SIZE.SM]: {},
      [SIZE.MD]: {},
    },
  },
  compoundVariants: [
    {
      variant: STYLED_VARIANTS,
      class: {
        root: [
          'inline-flex items-center gap-[7px]',
          'rounded-admin-control border font-medium no-underline',
          'cursor-pointer',
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-[.45]',
          'outline-hidden focus-visible:ring-2 focus-visible:ring-admin-brand focus-visible:ring-offset-2',
        ],
      },
    },
    {
      variant: STYLED_VARIANTS,
      size: SIZE.SM,
      class: {
        root: ['min-h-11 px-[9px] py-[5px] text-[12px] md:min-h-0'],
      },
    },
    {
      variant: STYLED_VARIANTS,
      size: SIZE.MD,
      class: {
        root: ['min-h-11 px-[13px] py-[8px] text-[13px] md:min-h-0'],
      },
    },
  ],
  defaultVariants: {
    variant: 'secondary',
    size: SIZE.MD,
  },
});

export type TButtonVariants = VariantProps<typeof buttonVariants>;
