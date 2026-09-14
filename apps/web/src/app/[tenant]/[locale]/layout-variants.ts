import { tv } from 'tailwind-variants';

export const localeLayoutVariants = tv({
  slots: {
    root: ['flex min-h-dvh flex-col'],
    // A flex container (not just a flex item) so a child needing to fill
    // this space can do so with its own `flex-1`, since a height percentage
    // doesn't resolve against a plain block's flex-grown size.
    content: ['flex flex-1 flex-col'],
  },
});
