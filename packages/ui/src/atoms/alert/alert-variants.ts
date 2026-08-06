import { ALERT_TONE } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const alertVariants = tv({
  base: [
    'flex w-full items-center gap-2',
    'border-l-[3px] py-0.5 pl-2',
    'font-mono text-copy',
  ],
  variants: {
    tone: {
      [ALERT_TONE.SUCCESS]: ['border-l-success text-success'],
      [ALERT_TONE.WARNING]: ['border-l-warn text-warn'],
      [ALERT_TONE.ERROR]: ['border-l-error text-error'],
      [ALERT_TONE.INFO]: ['border-l-accent text-accent'],
    },
  },
  defaultVariants: { tone: ALERT_TONE.INFO },
});

export type TAlertVariants = VariantProps<typeof alertVariants>;
