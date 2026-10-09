import { tv } from '@platform/utils/tv/tv';

export const tenantDetailsFormVariants = tv({
  slots: {
    root: ['flex flex-col gap-6'],
    cardWrap: ['relative'],
    cardInert: [],
    overlay: [
      'absolute inset-0 z-10 flex items-center justify-center gap-2',
      'rounded-admin bg-admin-surface/80 backdrop-blur-sm',
    ],
    fields: ['flex flex-col gap-4'],
    planControl: ['self-start'],
    footerActions: ['ml-auto flex items-center gap-2.5'],
  },
  variants: {
    pending: {
      true: { cardInert: ['opacity-50'] },
      false: {},
    },
  },
  defaultVariants: {
    pending: false,
  },
});
