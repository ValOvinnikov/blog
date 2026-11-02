import { ACCOUNT_BUTTON_STYLE } from '@blog/config';
import { tv } from '@platform/utils/tv/tv';

export const sampleAccountControlVariants = tv({
  slots: {
    trigger: [],
    panel: ['w-80 max-w-[calc(100cqw-2rem)]'],
  },
  variants: {
    appearance: {
      [ACCOUNT_BUTTON_STYLE.PILL]: {},
      [ACCOUNT_BUTTON_STYLE.CIRCLE]: {
        trigger: ['size-10 lg:size-10 pointer-coarse:size-10'],
      },
    },
  },
});
