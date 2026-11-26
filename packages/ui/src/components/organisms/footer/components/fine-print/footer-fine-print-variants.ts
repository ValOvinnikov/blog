import {
  DESCENDANT_LINKS_HOVER_UNDERLINE,
  tv,
} from '@shinefold/ui/lib/styling';

export const footerFinePrintVariants = tv({
  base: [
    'flex flex-wrap items-center gap-x-4 gap-y-2',
    ...DESCENDANT_LINKS_HOVER_UNDERLINE,
  ],
});
