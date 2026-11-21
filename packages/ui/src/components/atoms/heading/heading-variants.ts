import { TEXT_ROLE } from '@shinefold/config';
import { tv, TYPOGRAPHY } from '@shinefold/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const headingVariants = tv({
  variants: {
    visual: {
      ...TYPOGRAPHY,
      hero: TYPOGRAPHY[TEXT_ROLE.HERO_TITLE],
      post: TYPOGRAPHY[TEXT_ROLE.POST_TITLE],
      page: TYPOGRAPHY[TEXT_ROLE.PAGE_TITLE],
      section: TYPOGRAPHY[TEXT_ROLE.SECTION_TITLE],
      card: TYPOGRAPHY[TEXT_ROLE.CARD_TITLE],
      'prose-h2': TYPOGRAPHY[TEXT_ROLE.PROSE_H2],
      'prose-h3': TYPOGRAPHY[TEXT_ROLE.PROSE_H3],
      'prose-h4': TYPOGRAPHY[TEXT_ROLE.PROSE_H4],
    },
  },
});

export type THeadingVariants = VariantProps<typeof headingVariants>;
