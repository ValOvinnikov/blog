import { ALERT_TYPE } from '@blog/config';
import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

export const alertVariants = tv({
  slots: {
    root: ['flex w-full rounded-platform border'],
    icon: ['mt-0.5 self-start'],
    text: [],
    title: ['block text-platform-13-5 font-semibold'],
    description: [],
    action: ['flex flex-wrap items-center gap-2'],
  },
  variants: {
    type: {
      [ALERT_TYPE.SUCCESS]: {
        root: ['bg-platform-ok-weak border-platform-ok/30'],
        icon: ['text-platform-ok'],
      },
      [ALERT_TYPE.WARNING]: {
        root: ['bg-platform-warn-weak border-platform-warn/30'],
        icon: ['text-platform-warn'],
      },
      [ALERT_TYPE.ERROR]: {
        root: ['bg-platform-bad-weak border-platform-bad/30'],
        icon: ['text-platform-bad'],
      },
      [ALERT_TYPE.INFO]: {
        root: ['bg-platform-brand-weak border-platform-brand/30'],
        icon: ['text-platform-brand'],
      },
    },
    isNote: {
      false: {
        root: [
          'flex-wrap items-center gap-3 px-4 py-3.5',
          'shadow-platform in-data-[slot=card]:shadow-none',
        ],
        text: ['min-w-50 flex-1'],
        description: ['text-platform-muted text-platform-12-5'],
      },
      true: {
        root: ['gap-2.5 px-3.5 py-2.5'],
        text: ['min-w-0 flex-1'],
        description: [
          'text-platform-13 leading-platform-19 text-platform-text',
        ],
      },
    },
  },
  compoundVariants: [
    {
      type: ALERT_TYPE.INFO,
      isNote: true,
      class: { root: ['border-platform-brand-line'] },
    },
  ],
  defaultVariants: {
    type: ALERT_TYPE.INFO,
    isNote: false,
  },
});

export type TAlertVariants = VariantProps<typeof alertVariants>;
