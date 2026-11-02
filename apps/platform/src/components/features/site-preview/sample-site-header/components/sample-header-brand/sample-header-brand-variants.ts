import { tv } from '@platform/utils/tv/tv';

export const sampleHeaderBrandVariants = tv({
  slots: {
    root: ['flex items-center gap-2'],
    label: ['font-display text-base font-semibold text-text'],
  },
  variants: {
    isCompact: {
      true: { root: ['min-w-0'], label: ['truncate'] },
      false: {},
    },
  },
});
