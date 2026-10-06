import { proseMeasureCapSlot } from '@web/components/shared/portable-text/config/full-bleed';
import { tv } from 'tailwind-variants';

export const contentModuleViewVariants = tv({
  slots: {
    root: ['flex justify-center', '[&>div]:w-full'],
    prose: ['text-left', ...proseMeasureCapSlot],
  },
});
