import { TEXT_ROLE } from '@shinefold/config';
import {
  PROSE_LINK_UNDERLINE,
  PROSE_LINK_UNDERLINE_HOVER,
  tv,
  TYPOGRAPHY,
} from '@shinefold/ui/lib/styling';

export const quoteCardNameVariants = tv({
  base: [
    'inline-block rounded-sm',
    ...PROSE_LINK_UNDERLINE,
    PROSE_LINK_UNDERLINE_HOVER,
    TYPOGRAPHY[TEXT_ROLE.ATTRIBUTION],
    'not-has-[a]:no-underline',
    'has-[a]:transition-colors has-[a]:duration-base has-[a]:ease-smooth',
    'has-[a]:hover:text-brand-primary',
    'has-[:focus-visible]:outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-primary',
    'has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-ambient',
  ],
});
