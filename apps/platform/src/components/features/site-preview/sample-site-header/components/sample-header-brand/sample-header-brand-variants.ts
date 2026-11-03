import { tv } from '@platform/utils/tv/tv';

export const sampleHeaderBrandVariants = tv({
  slots: {
    root: ['flex items-center gap-2'],
    mark: [],
    label: ['font-display text-base font-semibold text-text'],
  },
  variants: {
    isCompact: {
      true: { root: ['min-w-0'], label: ['truncate'] },
      false: {},
    },
    isLarge: {
      true: {
        root: ['gap-2.5'],
        mark: ['size-8'],
        label: ['text-[1.25rem] tracking-[-0.2px]'],
      },
      false: {},
    },
  },
});
