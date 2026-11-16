import { tv } from '@platform/utils/tv/tv';

export const sampleSpinnerVariants = tv({
  variants: {
    isStill: {
      true: ['[&>*]:animate-none!', '[&>*]:before:animate-none!'],
    },
  },
});
