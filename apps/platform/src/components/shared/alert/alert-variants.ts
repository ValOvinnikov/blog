import { ALERT_TYPE } from '@blog/config';
import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

export const alertVariants = tv({
  slots: {
    root: [
      'flex w-full flex-wrap items-center gap-3',
      'rounded-admin border px-4 py-3.5',
      'shadow-admin in-data-[slot=card]:shadow-none',
    ],
    icon: ['mt-0.5 self-start'],
    text: ['min-w-[200px] flex-1'],
    title: ['block text-[13.5px] font-semibold'],
    description: ['text-admin-muted text-[12.5px]'],
    action: ['flex flex-wrap items-center gap-2'],
  },
  variants: {
    type: {
      [ALERT_TYPE.SUCCESS]: {
        root: ['bg-admin-ok-weak border-admin-ok/30'],
        icon: ['text-admin-ok'],
      },
      [ALERT_TYPE.WARNING]: {
        root: ['bg-admin-warn-weak border-admin-warn/30'],
        icon: ['text-admin-warn'],
      },
      [ALERT_TYPE.ERROR]: {
        root: ['bg-admin-bad-weak border-admin-bad/30'],
        icon: ['text-admin-bad'],
      },
      [ALERT_TYPE.INFO]: {
        root: ['bg-admin-brand-weak border-admin-brand/30'],
        icon: ['text-admin-brand'],
      },
    },
  },
  defaultVariants: { type: ALERT_TYPE.INFO },
});

export type TAlertVariants = VariantProps<typeof alertVariants>;
