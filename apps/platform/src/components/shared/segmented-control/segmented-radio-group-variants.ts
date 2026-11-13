import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { SEGMENTED_RADIO_LAYOUT } from '@platform/constants/segmented-control';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import {
  SELECTED_CHOICE_CLASSES,
  UNSELECTED_CHOICE_CLASSES,
} from '@platform/utils/selected-choice-classes/selected-choice-classes';
import { COLOUR_TRANSITION_CLASSES } from '@platform/utils/transition-classes/transition-classes';
import { tv } from '@platform/utils/tv/tv';

// Matches the fades' w-7, so a scrolled-to option clears the fade on its side.
export const SEGMENTED_FADE_WIDTH_PX = 28;

export const segmentedRadioGroupVariants = tv({
  slots: {
    root: ['w-full'],
    track: ['w-full'],
    option: ['text-platform-text'],
    optionLabel: [],
    optionDescription: [
      'block text-platform-12 leading-4 font-normal text-platform-muted md:leading-3.75',
    ],
    glyph: ['flex shrink-0'],
    check: [],
    fade: [
      'pointer-events-none absolute inset-y-0 w-7 from-platform-theme-track to-platform-theme-track/0 md:hidden',
    ],
    fadeStart: ['left-0 rounded-l-platform bg-linear-to-r'],
    fadeEnd: ['right-0 rounded-r-platform bg-linear-to-l'],
  },
  variants: {
    layout: {
      [SEGMENTED_RADIO_LAYOUT.TRACK]: {
        root: ['relative flex md:w-auto md:flex-none md:self-start'],
        track: [
          'relative flex gap-0.5 rounded-platform bg-platform-theme-track p-0.75',
          'max-md:overflow-x-auto max-md:[scrollbar-width:none] max-md:[&::-webkit-scrollbar]:hidden',
          'md:inline-flex md:w-auto',
        ],
        option: [
          'flex min-h-11 min-w-30 shrink-0 cursor-pointer flex-col items-start justify-center',
          'rounded-platform-control px-3 py-1.5 text-left md:min-h-0',
          'data-[checked]:bg-platform-surface data-[checked]:not-focus-visible:shadow-platform-xs',
          focusRingClasses(FOCUS_RING_GROUND.THEME_TRACK),
        ],
        optionLabel: [
          'block text-platform-13 leading-platform-18 font-semibold md:leading-4',
        ],
      },
      [SEGMENTED_RADIO_LAYOUT.TILES]: {
        root: ['@container flex flex-col gap-1.5'],
        track: ['grid grid-cols-2 gap-2 @sm:grid-cols-5'],
        option: [
          'relative flex min-h-14 min-w-0 items-center justify-start gap-2.5 rounded-platform-control bg-platform-surface',
          'px-2.5 py-2 text-left text-platform-13-5 leading-platform-18 font-medium',
          '@sm:min-h-0 @sm:flex-col @sm:justify-normal @sm:gap-1.5 @sm:px-1 @sm:pt-3.5 @sm:pb-1.75',
          '@sm:text-center @sm:text-platform-12 @sm:leading-4',
          COLOUR_TRANSITION_CLASSES,
          focusRingClasses(FOCUS_RING_GROUND.SURFACE),
        ],
        optionLabel: ['block min-w-0 break-words'],
        check: ['absolute top-1.5 right-1.5 flex @sm:top-0.75 @sm:right-0.75'],
      },
    },
    isSelected: {
      true: {},
      false: {},
    },
    isLocked: {
      true: {},
      false: {},
    },
    isWide: {
      true: { option: ['min-w-37.5'] },
    },
  },
  compoundVariants: [
    {
      layout: SEGMENTED_RADIO_LAYOUT.TILES,
      isLocked: false,
      class: { option: ['cursor-pointer'], check: ['text-platform-brand-ink'] },
    },
    {
      layout: SEGMENTED_RADIO_LAYOUT.TILES,
      isLocked: false,
      isSelected: true,
      class: { option: [...SELECTED_CHOICE_CLASSES, 'font-semibold'] },
    },
    {
      layout: SEGMENTED_RADIO_LAYOUT.TILES,
      isLocked: false,
      isSelected: false,
      class: {
        option: [
          ...UNSELECTED_CHOICE_CLASSES,
          'border-platform-control-line hover:border-platform-muted hover:bg-platform-hover',
        ],
      },
    },
    {
      layout: SEGMENTED_RADIO_LAYOUT.TILES,
      isLocked: true,
      class: {
        option: [...UNSELECTED_CHOICE_CLASSES, 'cursor-not-allowed'],
        glyph: ['opacity-(--platform-locked-fade)'],
        check: ['text-platform-muted'],
      },
    },
    {
      layout: SEGMENTED_RADIO_LAYOUT.TILES,
      isLocked: true,
      isSelected: true,
      class: { option: ['border-platform-control-line'] },
    },
    {
      layout: SEGMENTED_RADIO_LAYOUT.TILES,
      isLocked: true,
      isSelected: false,
      class: {
        option: [
          'border-platform-control-line-locked bg-platform-bg text-platform-muted',
        ],
      },
    },
  ],
  defaultVariants: {
    layout: SEGMENTED_RADIO_LAYOUT.TRACK,
    isSelected: false,
    isLocked: false,
  },
});
