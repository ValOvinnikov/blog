import { ALERT_TYPE } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const alertVariants = tv({
  base: ['flex w-full items-center gap-2', 'font-mono text-copy'],
  variants: {
    type: {
      [ALERT_TYPE.SUCCESS]: ['text-success'],
      [ALERT_TYPE.WARNING]: ['text-warn'],
      [ALERT_TYPE.ERROR]: ['text-error'],
      [ALERT_TYPE.INFO]: ['text-accent'],
    },
  },
  defaultVariants: { type: ALERT_TYPE.INFO },
});

export type TAlertVariants = VariantProps<typeof alertVariants>;
