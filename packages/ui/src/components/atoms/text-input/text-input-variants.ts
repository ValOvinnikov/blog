import {
  FIELD_CONTROL,
  FIELD_CONTROL_INVALID,
  tv,
} from '@shinefold/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

const ICON_SLOT_TEXT = 'font-mono text-copy text-brand-primary select-none';

export const textInputVariants = tv({
  slots: {
    root: ['relative w-full'],
    leadingIcon: [
      'pointer-events-none absolute inset-y-0 left-3 flex items-center',
      ICON_SLOT_TEXT,
    ],
    trailingIcon: [
      'pointer-events-none absolute inset-y-0 right-3 flex items-center',
      ICON_SLOT_TEXT,
    ],
    input: FIELD_CONTROL,
  },
  variants: {
    invalid: {
      true: { input: FIELD_CONTROL_INVALID },
    },
    hasLeadingIcon: {
      true: { input: ['pl-8'] },
    },
    hasTrailingIcon: {
      true: { input: ['pr-8'] },
    },
  },
});

export type TTextInputVariants = VariantProps<typeof textInputVariants>;
