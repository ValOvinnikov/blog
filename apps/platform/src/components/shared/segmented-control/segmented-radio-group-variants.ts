import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

// Matches the fades' w-7, so a scrolled-to option clears the fade on its side.
export const SEGMENTED_FADE_WIDTH_PX = 28;

export const segmentedRadioGroupVariants = tv({
  slots: {
    root: ['relative flex w-full md:w-auto md:flex-none md:self-start'],
    track: [
      'relative flex w-full gap-0.5 rounded-admin bg-admin-theme-track p-0.75',
      'max-md:overflow-x-auto max-md:[scrollbar-width:none] max-md:[&::-webkit-scrollbar]:hidden',
      'md:inline-flex md:w-auto',
    ],
    option: [
      'flex min-h-11 min-w-30 shrink-0 cursor-pointer flex-col items-start justify-center',
      'rounded-admin-control px-3 py-1.5 text-left text-admin-text md:min-h-0',
      'data-[checked]:bg-admin-surface data-[checked]:not-focus-visible:shadow-admin-xs',
      focusRingClasses(FOCUS_RING_GROUND.THEME_TRACK),
    ],
    optionLabel: [
      'block text-admin-13 leading-admin-18 font-semibold md:leading-4',
    ],
    optionDescription: [
      'block text-admin-12 leading-4 font-normal text-admin-muted md:leading-3.75',
    ],
    fade: [
      'pointer-events-none absolute inset-y-0 w-7 from-admin-theme-track to-admin-theme-track/0 md:hidden',
    ],
    fadeStart: ['left-0 rounded-l-admin bg-linear-to-r'],
    fadeEnd: ['right-0 rounded-r-admin bg-linear-to-l'],
  },
  variants: {
    isWide: {
      true: { option: ['min-w-37.5'] },
    },
  },
});
