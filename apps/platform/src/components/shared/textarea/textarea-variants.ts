import { DISABLED_READONLY_SURFACE_CLASSES } from '@platform/utils/disabled-state-classes/disabled-state-classes';
import {
  FIELD_FOCUS_CLASSES,
  FIELD_SURFACE_CLASSES,
} from '@platform/utils/field-surface-classes/field-surface-classes';
import { INVALID_SURFACE_CLASSES } from '@platform/utils/invalid-state-classes/invalid-state-classes';
import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

export const textareaVariants = tv({
  base: [
    'w-full',
    FIELD_SURFACE_CLASSES,
    FIELD_FOCUS_CLASSES,
    INVALID_SURFACE_CLASSES,
  ],
  variants: {
    isDisabled: {
      true: `${DISABLED_READONLY_SURFACE_CLASSES} text-admin-muted cursor-not-allowed`,
    },
    isReadOnly: {
      true: `${DISABLED_READONLY_SURFACE_CLASSES} text-admin-muted`,
    },
  },
});

export type TTextareaVariants = VariantProps<typeof textareaVariants>;
