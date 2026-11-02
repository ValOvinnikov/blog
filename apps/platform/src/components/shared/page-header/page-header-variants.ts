import { tv } from '@platform/utils/tv/tv';

export const pageHeaderVariants = tv({
  slots: {
    root: ['flex flex-wrap items-start gap-4'],
    titleGroup: ['min-w-0 flex-[1_1_320px]'],
    titleRow: ['flex flex-wrap items-center gap-2.5'],
    description: ['mt-1 leading-5'],
    actions: ['flex items-center gap-2'],
  },
  variants: {
    isTitleHiddenBelowLg: {
      true: {},
    },
    hasActions: {
      true: {},
    },
  },
  compoundVariants: [
    {
      isTitleHiddenBelowLg: true,
      hasActions: true,
      class: { titleGroup: ['max-lg:sr-only'] },
    },
    {
      isTitleHiddenBelowLg: true,
      hasActions: false,
      class: { root: ['max-lg:sr-only'] },
    },
  ],
});
