import { tv } from '@platform/utils/tv/tv';

export const voiceKeyFrameVariants = tv({
  base: ['rounded-sm outline-offset-4 transition-[outline-color]'],
  variants: {
    isFocused: {
      true: ['outline-2 outline-brand-primary outline-dashed'],
      false: ['outline-0 outline-transparent'],
    },
  },
});
