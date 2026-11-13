import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { SEGMENTED_LAYOUT } from '@platform/constants/segmented-control';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const segmentedControlVariants = tv({
  slots: {
    wrapper: ['flex w-full flex-col gap-1.5'],
    root: [
      'grid w-full grid-cols-2 gap-[6px]',
      'lg:inline-flex lg:w-auto lg:flex-wrap lg:items-center lg:gap-[2px] lg:self-start',
      'lg:rounded-platform-control lg:border lg:bg-platform-bg lg:p-[2px]',
      'data-[disabled]:opacity-(--platform-locked-fade)',
    ],
    option: [
      'flex min-h-11 items-center justify-start rounded-platform-control border px-3 text-left',
      'text-platform-13-5 font-medium data-[pressed]:font-semibold',
      'lg:h-[30px] lg:min-h-0 lg:justify-center lg:rounded-platform-3 lg:border-0 lg:bg-transparent lg:text-center lg:text-platform-13',
      'disabled:cursor-not-allowed',
      focusRingClasses(FOCUS_RING_GROUND.BG),
    ],
    glyph: ['flex'],
  },
  variants: {
    hasGlyphs: {
      true: {
        option: [
          'min-h-[60px] flex-col justify-center gap-1 px-1.5 text-center leading-platform-14',
          'lg:h-auto lg:min-h-[52px] lg:min-w-14 lg:gap-[3px] lg:px-2.5 lg:py-1.5',
        ],
      },
      false: {},
    },
    layout: {
      [SEGMENTED_LAYOUT.FIT]: {},
      [SEGMENTED_LAYOUT.WIDE]: { option: ['lg:min-w-[94px]'] },
      [SEGMENTED_LAYOUT.SINGLE_ROW]: {
        root: [
          'max-lg:auto-cols-fr max-lg:grid-flow-col max-lg:grid-cols-none',
        ],
      },
    },
    isLocked: {
      true: {
        root: ['lg:border-platform-control-line-locked'],
        option: [
          'cursor-not-allowed border-platform-control-line-locked bg-platform-bg text-platform-muted',
          'data-[pressed]:border-platform-control-line data-[pressed]:bg-platform-surface data-[pressed]:text-platform-text',
          'lg:data-[pressed]:not-focus-visible:shadow-[inset_0_0_0_1px_var(--platform-control-line)]',
        ],
      },
      false: {
        root: ['lg:border-platform-control-line'],
        option: [
          'cursor-pointer border-platform-control-line bg-platform-surface text-platform-text lg:text-platform-muted',
          'data-[pressed]:border-platform-brand-ink data-[pressed]:bg-platform-brand-weak data-[pressed]:text-platform-brand-strong',
          'max-lg:data-[pressed]:not-focus-visible:shadow-[inset_0_0_0_0.5px_var(--platform-brand-ink)]',
          'lg:data-[pressed]:bg-platform-surface lg:data-[pressed]:text-platform-text',
          'lg:data-[pressed]:not-focus-visible:shadow-[inset_0_0_0_1.5px_var(--platform-brand-ink)]',
        ],
      },
    },
  },
  compoundVariants: [
    {
      isLocked: false,
      hasGlyphs: true,
      class: {
        option: [
          'lg:hover:not-data-[pressed]:bg-platform-hover lg:hover:not-data-[pressed]:text-platform-text',
        ],
      },
    },
  ],
  defaultVariants: {
    isLocked: false,
    hasGlyphs: false,
    layout: SEGMENTED_LAYOUT.FIT,
  },
});
