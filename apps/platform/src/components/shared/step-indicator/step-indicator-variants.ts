import { STEP_INDICATOR_STATE } from '@platform/constants/step-indicator';
import { tv } from '@platform/utils/tv/tv';

export const stepIndicatorVariants = tv({
  slots: {
    root: ['flex flex-none flex-col items-center self-stretch'],
    circle: [
      'flex h-6 w-6 flex-none items-center justify-center',
      'rounded-full text-platform-12-5 font-bold',
    ],
    connector: ['my-1 w-0.5 flex-1 bg-platform-line-2'],
  },
  variants: {
    state: {
      [STEP_INDICATOR_STATE.DONE]: {
        circle: ['bg-platform-ok text-platform-on-brand-ink'],
      },
      [STEP_INDICATOR_STATE.FAILED]: {
        circle: ['bg-platform-bad text-platform-on-brand-ink'],
      },
      [STEP_INDICATOR_STATE.RUNNING]: {
        circle: ['bg-platform-warn text-platform-on-brand-ink'],
      },
      [STEP_INDICATOR_STATE.ACTIVE]: {
        circle: ['bg-platform-brand text-platform-on-brand-ink'],
      },
      [STEP_INDICATOR_STATE.UPCOMING]: {
        circle: ['bg-platform-line-2 text-platform-muted'],
      },
    },
    isConnectorDone: {
      true: { connector: ['bg-platform-ok'] },
      false: {},
    },
    isOnDark: {
      true: { circle: ['text-platform-12 font-semibold'] },
      false: {},
    },
  },
  compoundVariants: [
    {
      isOnDark: true,
      state: STEP_INDICATOR_STATE.DONE,
      class: { circle: ['bg-platform-rail-accent text-platform-rail'] },
    },
    {
      isOnDark: true,
      state: STEP_INDICATOR_STATE.ACTIVE,
      class: {
        circle: [
          'border-2 border-platform-rail-accent bg-transparent text-platform-rail-accent',
        ],
      },
    },
    {
      isOnDark: true,
      state: STEP_INDICATOR_STATE.UPCOMING,
      class: {
        circle: [
          'border-[1.5px] border-platform-rail-muted bg-transparent text-platform-rail-muted',
        ],
      },
    },
  ],
  defaultVariants: {
    isConnectorDone: false,
    isOnDark: false,
  },
});
