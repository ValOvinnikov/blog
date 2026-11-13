import { SETTINGS_FORM_STACK } from '@platform/constants/settings-form';
import { tv } from '@platform/utils/tv/tv';

export const shellHeaderVariants = tv({
  slots: {
    root: [],
    savedStatus: ['text-platform-12 text-platform-ok'],
  },
  variants: {
    stack: {
      [SETTINGS_FORM_STACK.LOOK]: {},
      [SETTINGS_FORM_STACK.VOICE]: { root: ['max-md:gap-y-3'] },
    },
  },
});
