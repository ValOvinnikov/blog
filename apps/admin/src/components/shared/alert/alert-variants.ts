import { ALERT_TYPE } from '@blog/config';
import { tv, type VariantProps } from 'tailwind-variants';

export const alertVariants = tv({
  slots: {
    root: [
      'flex w-full flex-wrap items-center gap-3',
      'rounded-admin border px-4 py-3.5',
      'shadow-admin',
    ],
    glyph: ['shrink-0 text-base leading-none'],
    text: ['min-w-[200px] flex-1'],
    title: ['block text-[13.5px] font-semibold'],
    description: ['text-admin-muted block text-[12.5px]'],
  },
  variants: {
    type: {
      [ALERT_TYPE.SUCCESS]: {
        root: ['bg-admin-ok-weak border-admin-ok/30'],
        glyph: ['text-admin-ok'],
      },
      [ALERT_TYPE.WARNING]: {
        root: ['bg-admin-warn-weak border-admin-warn/30'],
        glyph: ['text-admin-warn'],
      },
      [ALERT_TYPE.ERROR]: {
        root: ['bg-admin-bad-weak border-admin-bad/30'],
        glyph: ['text-admin-bad'],
      },
      [ALERT_TYPE.INFO]: {
        root: ['bg-admin-brand-weak border-admin-brand/30'],
        glyph: ['text-admin-brand'],
      },
    },
  },
  defaultVariants: { type: ALERT_TYPE.INFO },
});

export type TAlertVariants = VariantProps<typeof alertVariants>;
