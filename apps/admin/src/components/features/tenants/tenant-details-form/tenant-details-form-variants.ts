import { tv } from '@admin/utils/tv/tv';

export const tenantDetailsFormVariants = tv({
  slots: {
    root: ['flex flex-col gap-6'],
    cardWrap: ['relative'],
    cardInert: [],
    overlay: [
      'absolute inset-0 z-10 flex items-center justify-center gap-2',
      'rounded-admin bg-admin-surface/80 backdrop-blur-sm',
    ],
    fields: ['flex flex-col gap-5'],
    hint: ['text-[11.5px] text-admin-muted'],
    planControl: ['self-start'],
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
