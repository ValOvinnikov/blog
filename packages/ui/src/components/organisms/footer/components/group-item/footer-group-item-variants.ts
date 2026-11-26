import {
  DESCENDANT_LINKS_HOVER_UNDERLINE,
  tv,
} from '@shinefold/ui/lib/styling';

export const footerGroupItemVariants = tv({
  base: ['min-w-0 break-words', ...DESCENDANT_LINKS_HOVER_UNDERLINE],
});
