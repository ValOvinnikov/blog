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
    option: ['text-admin-text'],
    optionLabel: [],
    optionDescription: [
      'block text-admin-12 leading-4 font-normal text-admin-muted md:leading-3.75',
    ],
    glyph: ['flex shrink-0'],
    check: [],
    fade: [
      'pointer-events-none absolute inset-y-0 w-7 from-admin-theme-track to-admin-theme-track/0 md:hidden',
    ],
    fadeStart: ['left-0 rounded-l-admin bg-linear-to-r'],
    fadeEnd: ['right-0 rounded-r-admin bg-linear-to-l'],
  },
  variants: {
    layout: {
      [SEGMENTED_RADIO_LAYOUT.TRACK]: {
        root: ['relative flex md:w-auto md:flex-none md:self-start'],
        track: [
          'relative flex gap-0.5 rounded-admin bg-admin-theme-track p-0.75',
          'max-md:overflow-x-auto max-md:[scrollbar-width:none] max-md:[&::-webkit-scrollbar]:hidden',
          'md:inline-flex md:w-auto',
        ],
        option: [
          'flex min-h-11 min-w-30 shrink-0 cursor-pointer flex-col items-start justify-center',
          'rounded-admin-control px-3 py-1.5 text-left md:min-h-0',
          'data-[checked]:bg-admin-surface data-[checked]:not-focus-visible:shadow-admin-xs',
          focusRingClasses(FOCUS_RING_GROUND.THEME_TRACK),
        ],
        optionLabel: [
          'block text-admin-13 leading-admin-18 font-semibold md:leading-4',
        ],
      },
      [SEGMENTED_RADIO_LAYOUT.TILES]: {
        root: ['flex flex-col gap-1.5'],
        track: ['grid grid-cols-2 gap-2 sm:grid-cols-5'],
        option: [
          'relative flex min-w-0 flex-col items-center gap-1.5 rounded-admin-control bg-admin-surface',
          'px-1 pt-3.5 pb-[7px] text-center text-admin-12 leading-4 font-medium',
          'max-sm:min-h-14 max-sm:flex-row max-sm:justify-start max-sm:gap-2.5 max-sm:px-2.5 max-sm:py-2',
          'max-sm:text-left max-sm:text-admin-13-5 max-sm:leading-admin-18',
          COLOUR_TRANSITION_CLASSES,
          focusRingClasses(FOCUS_RING_GROUND.SURFACE),
        ],
        optionLabel: ['block min-w-0 break-words'],
        check: [
          'absolute top-[3px] right-[3px] flex max-sm:top-1.5 max-sm:right-1.5',
        ],
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
      class: { option: ['cursor-pointer'], check: ['text-admin-brand-ink'] },
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
          'border-admin-control-line hover:border-admin-muted hover:bg-admin-surface-2',
        ],
      },
    },
    {
      layout: SEGMENTED_RADIO_LAYOUT.TILES,
      isLocked: true,
      class: {
        option: [...UNSELECTED_CHOICE_CLASSES, 'cursor-not-allowed'],
        glyph: ['opacity-[.55]'],
        check: ['text-admin-muted'],
      },
    },
    {
      layout: SEGMENTED_RADIO_LAYOUT.TILES,
      isLocked: true,
      isSelected: true,
      class: { option: ['border-admin-control-line'] },
    },
    {
      layout: SEGMENTED_RADIO_LAYOUT.TILES,
      isLocked: true,
      isSelected: false,
      class: {
        option: [
          'border-admin-control-line-locked bg-admin-bg text-admin-muted',
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
