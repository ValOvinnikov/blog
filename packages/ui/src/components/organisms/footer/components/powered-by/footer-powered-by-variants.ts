import { TRANSITION_COLORS, tv } from '@blog/ui/lib/styling';

export const footerPoweredByVariants = tv({
  slots: {
    root: [
      'group/powered-by whitespace-nowrap',
      '@min-[40rem]/footer:ms-auto group-data-[layout=CENTRED]/footer:ms-0',
    ],
    label: [
      'underline decoration-transparent decoration-1 underline-offset-3',
      'group-hover/powered-by:decoration-current group-focus-visible/powered-by:decoration-transparent',
      TRANSITION_COLORS,
    ],
    // 0.279em = the 1.25em logo's lettering baseline (y 97.1 of 125) lowered onto the text baseline.
    logo: ['inline-block h-[1.25em] w-auto align-[-0.279em]'],
  },
});
