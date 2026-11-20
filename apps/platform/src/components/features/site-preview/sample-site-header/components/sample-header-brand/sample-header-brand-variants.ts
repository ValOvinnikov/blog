import { tv } from '@platform/utils/tv/tv';

export const sampleHeaderBrandVariants = tv({
  slots: {
    root: ['flex items-center gap-2.5'],
    mark: ['size-8'],
    label: [
      'font-display text-[1.25rem] font-semibold tracking-[-0.2px] text-text',
    ],
  },
  variants: {
    isCompact: {
      true: { root: ['min-w-0'], label: ['truncate'] },
      false: {},
    },
  },
});
