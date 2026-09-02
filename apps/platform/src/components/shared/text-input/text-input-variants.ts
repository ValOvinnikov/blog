import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

export const textInputVariants = tv({
  base: [
    'w-full rounded-[9px] border px-[11px] py-[9px]',
    'text-[13.5px] text-admin-text bg-admin-surface border-admin-line',
    'focus-visible:outline-2 focus-visible:outline-admin-brand-weak focus-visible:border-admin-brand',
  ],
  variants: {
    isInvalid: {
      true: 'border-admin-bad text-admin-bad',
    },
    isDisabled: {
      true: 'bg-admin-line-2 text-admin-faint border-admin-line-2 cursor-not-allowed',
    },
    isReadOnly: {
      true: 'bg-admin-line-2 text-admin-faint border-admin-line-2',
    },
  },
});

export type TTextInputVariants = VariantProps<typeof textInputVariants>;
