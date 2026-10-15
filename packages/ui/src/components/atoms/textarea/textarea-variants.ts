import { FIELD_CONTROL, FIELD_CONTROL_INVALID, tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const textareaVariants = tv({
  base: [...FIELD_CONTROL, 'block min-h-32 resize-y'],
  variants: {
    invalid: {
      true: FIELD_CONTROL_INVALID,
    },
  },
});

export type TTextareaVariants = VariantProps<typeof textareaVariants>;
