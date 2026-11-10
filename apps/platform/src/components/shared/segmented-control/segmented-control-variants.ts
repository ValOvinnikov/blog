import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { SEGMENTED_OPTION_WIDTH } from '@platform/constants/segmented-control';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const segmentedControlVariants = tv({
  slots: {
    wrapper: ['flex w-full flex-col gap-1.5'],
    root: [
      'grid w-full grid-cols-2 gap-[6px]',
      'lg:inline-flex lg:w-auto lg:flex-wrap lg:items-center lg:gap-[2px] lg:self-start',
      'lg:rounded-admin-control lg:border lg:bg-admin-bg lg:p-[2px]',
      'data-[disabled]:opacity-[.55]',
    ],
    option: [
      'flex min-h-11 items-center justify-start rounded-admin-control border px-3 text-left',
      'text-admin-13-5 font-medium data-[pressed]:font-semibold',
      'lg:h-[30px] lg:min-h-0 lg:justify-center lg:rounded-admin-3 lg:border-0 lg:bg-transparent lg:text-center lg:text-admin-13',
      'disabled:cursor-not-allowed',
      focusRingClasses(FOCUS_RING_GROUND.BG),
    ],
    glyph: ['flex'],
    selectedDescription: [
      'm-0 text-admin-12-5 leading-admin-18 text-admin-muted empty:hidden',
    ],
  },
  variants: {
    hasGlyphs: {
      true: {
        option: [
          'min-h-[60px] flex-col justify-center gap-1 px-1.5 text-center leading-admin-14',
          'lg:h-auto lg:min-h-[52px] lg:min-w-14 lg:gap-[3px] lg:px-2.5 lg:py-1.5',
        ],
      },
      false: {},
    },
    isSingleRow: {
      true: {
        root: [
          'max-lg:auto-cols-fr max-lg:grid-flow-col max-lg:grid-cols-none',
        ],
      },
      false: {},
    },
    optionWidth: {
      [SEGMENTED_OPTION_WIDTH.FIT]: {},
      [SEGMENTED_OPTION_WIDTH.WIDE]: { option: ['lg:min-w-[94px]'] },
    },
    isLocked: {
      true: {
        root: ['lg:border-admin-control-line-locked'],
        option: [
          'cursor-not-allowed border-admin-control-line-locked bg-admin-bg text-admin-muted',
          'data-[pressed]:border-admin-control-line data-[pressed]:bg-admin-surface data-[pressed]:text-admin-text',
          'lg:data-[pressed]:not-focus-visible:shadow-[inset_0_0_0_1px_var(--admin-control-line)]',
        ],
      },
      false: {
        root: ['lg:border-admin-control-line'],
        option: [
          'cursor-pointer border-admin-control-line bg-admin-surface text-admin-text lg:text-admin-muted',
          'data-[pressed]:border-admin-brand-ink data-[pressed]:bg-admin-brand-weak data-[pressed]:text-admin-brand-strong',
          'max-lg:data-[pressed]:not-focus-visible:shadow-[inset_0_0_0_0.5px_var(--admin-brand-ink)]',
          'lg:data-[pressed]:bg-admin-surface lg:data-[pressed]:text-admin-text',
          'lg:data-[pressed]:not-focus-visible:shadow-[inset_0_0_0_1.5px_var(--admin-brand-ink)]',
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
          'lg:hover:not-data-[pressed]:bg-admin-hover lg:hover:not-data-[pressed]:text-admin-text',
        ],
      },
    },
  ],
  defaultVariants: {
    isLocked: false,
    hasGlyphs: false,
    isSingleRow: false,
    optionWidth: SEGMENTED_OPTION_WIDTH.FIT,
  },
});
