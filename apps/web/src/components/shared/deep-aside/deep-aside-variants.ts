import { tv } from 'tailwind-variants';

export const deepAsideVariants = tv({
  slots: {
    // Hidden unless the nearest `DepthProvider` wrapper is in DEEP — pure
    // CSS, so switching depth is a same-page show/hide, never a re-fetch.
    root: ['hidden', 'group-data-[depth=DEEP]/depth:block'],
  },
});
