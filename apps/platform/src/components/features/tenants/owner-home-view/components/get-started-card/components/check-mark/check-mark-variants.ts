import { tv } from '@platform/utils/tv/tv';

export const checkMarkVariants = tv({
  base: ['flex size-5 flex-none items-center justify-center rounded-full'],
  variants: {
    isDone: {
      true: ['bg-platform-ok text-platform-on-brand-ink'],
      false: ['border-[1.5px] border-platform-control-line'],
    },
  },
});
