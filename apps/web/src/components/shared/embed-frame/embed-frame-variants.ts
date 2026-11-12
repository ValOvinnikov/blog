import { tv } from '@blog/ui/lib/styling';

export const embedFrameVariants = tv({
  slots: {
    root: ['m-0 flex w-full flex-col gap-3'],
    frame: ['w-full'],
    iframe: ['absolute inset-0 size-full border-0'],
    caption: ['font-body text-sm text-muted'],
  },
  variants: {
    isVertical: {
      true: { frame: ['mx-auto max-w-xs'] },
    },
  },
});
