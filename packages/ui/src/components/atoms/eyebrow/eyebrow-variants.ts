import { TEXT_ROLE } from '@shinefold/config';
import { tv, TYPOGRAPHY } from '@shinefold/ui/lib/styling';

export const eyebrowVariants = tv({
  slots: {
    root: [TYPOGRAPHY[TEXT_ROLE.EYEBROW]],
    // The negative margin cancels the padding, so the chip grows around the text without moving it when the chip is transparent.
    chip: [
      '-mx-2 rounded-sm bg-eyebrow-chip px-2 py-0.5',
      'box-decoration-clone',
    ],
  },
  variants: {
    hasHref: {
      true: {
        root: [
          'no-underline transition-colors duration-base ease-smooth',
          'hover:text-brand-primary-hover',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
          'focus-visible:ring-offset-2 focus-visible:ring-offset-ambient',
        ],
      },
    },
  },
});
