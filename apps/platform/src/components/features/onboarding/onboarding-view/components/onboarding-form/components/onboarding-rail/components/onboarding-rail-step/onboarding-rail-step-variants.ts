import { STEP_INDICATOR_STATE } from '@platform/constants/step-indicator';
import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

export const onboardingRailStepVariants = tv({
  slots: {
    item: ['flex items-center gap-3 rounded-platform px-3 py-2.5'],
    body: ['flex min-w-0 flex-col gap-0.5'],
    label: ['text-platform-14 leading-6 font-medium'],
    summary: ['truncate text-platform-12 text-platform-rail-muted'],
    status: ['sr-only'],
  },
  variants: {
    state: {
      [STEP_INDICATOR_STATE.DONE]: {
        item: ['items-start'],
        label: ['text-platform-rail-text'],
      },
      [STEP_INDICATOR_STATE.ACTIVE]: {
        item: ['bg-platform-rail-raised'],
        label: ['font-semibold text-white'],
      },
      [STEP_INDICATOR_STATE.UPCOMING]: { label: ['text-platform-rail-muted'] },
    },
  },
});

export type TOnboardingRailStepVariants = VariantProps<
  typeof onboardingRailStepVariants
>;
