import { TEXT_ROLE } from '@shinefold/config';
import { tv, TYPOGRAPHY } from '@shinefold/ui/lib/styling';

export const eyebrowVariants = tv({
  base: [TYPOGRAPHY[TEXT_ROLE.EYEBROW]],
  variants: {
    hasHref: {
      true: [
        'no-underline transition-colors duration-base ease-smooth',
        'hover:text-brand-primary-hover',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-ambient',
      ],
    },
  },
});
