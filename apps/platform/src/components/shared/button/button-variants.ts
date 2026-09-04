import { SIZE } from '@blog/config';
import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

export const buttonVariants = tv({
  base: [
    'inline-flex items-center gap-[7px]',
    'rounded-[9px] border font-medium no-underline',
    'cursor-pointer',
    'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-[.45]',
    'outline-hidden focus-visible:ring-2 focus-visible:ring-admin-brand focus-visible:ring-offset-2',
  ],
  variants: {
    variant: {
      primary: 'border-admin-brand bg-admin-brand text-white shadow-admin',
      secondary:
        'border-admin-control-line bg-admin-surface text-admin-text shadow-admin hover:bg-admin-surface-2',
      ghost:
        'border-transparent bg-transparent text-admin-text hover:bg-admin-line-2',
      danger:
        'border-admin-bad-line bg-admin-bad-weak text-admin-bad shadow-admin',
    },
    size: {
      [SIZE.SM]: 'px-[9px] py-[5px] text-[12px]',
      [SIZE.MD]: 'px-[13px] py-[8px] text-[13px]',
    },
  },
  defaultVariants: {
    variant: 'secondary',
    size: SIZE.MD,
  },
});

export type TButtonVariants = VariantProps<typeof buttonVariants>;
