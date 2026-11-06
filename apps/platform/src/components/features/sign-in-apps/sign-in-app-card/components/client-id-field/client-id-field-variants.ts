import { tv } from '@platform/utils/tv/tv';

export const clientIdFieldVariants = tv({
  slots: {
    wrapper: ['relative'],
    input: [],
  },
  variants: {
    isRevealable: {
      true: { input: ['pr-11 md:pr-9'] },
    },
    isMasked: {
      true: { input: ['font-mono text-admin-12'] },
    },
  },
});
