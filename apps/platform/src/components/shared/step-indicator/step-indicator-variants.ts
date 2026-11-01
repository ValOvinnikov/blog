import { STEP_INDICATOR_STATE } from '@platform/constants/step-indicator';
import { tv } from '@platform/utils/tv/tv';

export const stepIndicatorVariants = tv({
  slots: {
    root: ['flex flex-none flex-col items-center self-stretch'],
    circle: [
      'flex h-6 w-6 flex-none items-center justify-center',
      'rounded-full text-admin-12-5 font-bold',
    ],
    connector: ['my-1 w-0.5 flex-1 bg-admin-line-2'],
  },
  variants: {
    state: {
      [STEP_INDICATOR_STATE.DONE]: { circle: ['bg-admin-ok text-white'] },
      [STEP_INDICATOR_STATE.FAILED]: { circle: ['bg-admin-bad text-white'] },
      [STEP_INDICATOR_STATE.RUNNING]: { circle: ['bg-admin-warn text-white'] },
      [STEP_INDICATOR_STATE.ACTIVE]: { circle: ['bg-admin-brand text-white'] },
      [STEP_INDICATOR_STATE.UPCOMING]: {
        circle: ['bg-admin-line-2 text-admin-muted'],
      },
    },
    isConnectorDone: {
      true: { connector: ['bg-admin-ok'] },
      false: {},
    },
    isOnDark: {
      true: { circle: ['text-admin-12 font-semibold'] },
      false: {},
    },
  },
  compoundVariants: [
    {
      isOnDark: true,
      state: STEP_INDICATOR_STATE.DONE,
      class: { circle: ['bg-admin-rail-accent text-admin-rail'] },
    },
    {
      isOnDark: true,
      state: STEP_INDICATOR_STATE.ACTIVE,
      class: {
        circle: [
          'border-2 border-admin-rail-accent bg-transparent text-admin-rail-accent',
        ],
      },
    },
    {
      isOnDark: true,
      state: STEP_INDICATOR_STATE.UPCOMING,
      class: {
        circle: [
          'border-[1.5px] border-admin-rail-muted bg-transparent text-admin-rail-muted',
        ],
      },
    },
  ],
  defaultVariants: {
    isConnectorDone: false,
    isOnDark: false,
  },
});
