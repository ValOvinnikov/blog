import { tv } from '@shinefold/ui/lib/styling';

export const accountTriggersVariants = tv({
  slots: {
    wide: [],
    phone: ['lg:hidden'],
  },
  variants: {
    isWideOnly: {
      true: { wide: ['max-lg:hidden'] },
    },
  },
});
