import { DISABLED_READONLY_SURFACE_CLASSES } from '@platform/utils/disabled-state-classes/disabled-state-classes';
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
      true: `${DISABLED_READONLY_SURFACE_CLASSES} text-admin-faint cursor-not-allowed`,
    },
    isReadOnly: {
      true: `${DISABLED_READONLY_SURFACE_CLASSES} text-admin-muted`,
    },
  },
});

export type TTextInputVariants = VariantProps<typeof textInputVariants>;
