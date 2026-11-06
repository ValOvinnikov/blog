import { tv } from '@platform/utils/tv/tv';

export const clientSecretFieldVariants = tv({
  slots: {
    actions: ['flex items-center gap-2'],
    wrapper: ['relative'],
    input: [],
  },
  variants: {
    isRevealable: {
      true: { input: ['pr-11 md:pr-9'] },
    },
  },
});
