import { ALERT_TYPE } from '@blog/config';
import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

export const alertVariants = tv({
  slots: {
    root: ['flex w-full rounded-admin border'],
    icon: ['mt-0.5 self-start'],
    text: [],
    title: ['block text-admin-13-5 font-semibold'],
    description: [],
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
    isNote: {
      false: {
        root: [
          'flex-wrap items-center gap-3 px-4 py-3.5',
          'shadow-admin in-data-[slot=card]:shadow-none',
        ],
        text: ['min-w-[200px] flex-1'],
        description: ['text-admin-muted text-admin-12-5'],
      },
      true: {
        root: ['gap-2.5 px-3.5 py-2.5'],
        text: ['min-w-0 flex-1'],
        description: ['text-admin-13 leading-[19px] text-admin-text'],
      },
    },
  },
  compoundVariants: [
    {
      type: ALERT_TYPE.INFO,
      isNote: true,
      class: { root: ['border-admin-brand-line'] },
    },
  ],
  defaultVariants: {
    type: ALERT_TYPE.INFO,
    isNote: false,
  },
});

export type TAlertVariants = VariantProps<typeof alertVariants>;
