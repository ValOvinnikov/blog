import { TRANSITION_COLORS, tv } from '@blog/ui/lib/styling';

export const footerPoweredByVariants = tv({
  slots: {
    root: [
      'group/powered-by whitespace-nowrap',
      '@min-[40rem]/footer:ms-auto group-data-[layout=CENTRED]/footer:ms-0',
    ],
    name: [
      'font-medium',
      'underline decoration-transparent decoration-1 underline-offset-3',
      'group-hover/powered-by:decoration-current group-focus-visible/powered-by:decoration-transparent',
      TRANSITION_COLORS,
    ],
  },
});
