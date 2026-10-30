import { textVariants } from '@platform/components/shared/text/text-variants';
import { tv } from '@platform/utils/tv/tv';

export const segmentedProgressVariants = tv({
  slots: {
    root: ['flex items-center gap-3'],
    label: [textVariants({ variant: 'meta' }), 'whitespace-nowrap'],
    track: ['flex max-w-60 flex-1 gap-1'],
    segment: ['h-1 flex-1 rounded-full'],
  },
  variants: {
    isFilled: {
      true: { segment: ['bg-admin-brand'] },
      false: { segment: ['bg-admin-line-2'] },
    },
  },
});
