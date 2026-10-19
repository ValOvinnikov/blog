import { tv } from '@blog/ui/lib/styling';
import { proseMeasureCapSlot } from '@web/components/shared/portable-text/config/full-bleed';

export const contentModuleViewVariants = tv({
  slots: {
    root: ['flex justify-center', '[&>div]:w-full'],
    prose: ['text-left', ...proseMeasureCapSlot],
  },
});
