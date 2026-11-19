import { SIZE, TEXT_ROLE } from '@shinefold/config';
import { tv, TYPOGRAPHY } from '@shinefold/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const headingVariants = tv({
  base: ['font-display font-heading text-text'],
  variants: {
    visual: {
      [TEXT_ROLE.HERO_TITLE]: TYPOGRAPHY[TEXT_ROLE.HERO_TITLE],
      [TEXT_ROLE.POST_TITLE]: TYPOGRAPHY[TEXT_ROLE.POST_TITLE],
      [TEXT_ROLE.PAGE_TITLE]: TYPOGRAPHY[TEXT_ROLE.PAGE_TITLE],
      [TEXT_ROLE.SECTION_TITLE]: TYPOGRAPHY[TEXT_ROLE.SECTION_TITLE],
      [TEXT_ROLE.CARD_TITLE]: TYPOGRAPHY[TEXT_ROLE.CARD_TITLE],
      [TEXT_ROLE.ITEM_TITLE]: TYPOGRAPHY[TEXT_ROLE.ITEM_TITLE],
      [TEXT_ROLE.DIALOG_TITLE]: TYPOGRAPHY[TEXT_ROLE.DIALOG_TITLE],
      [TEXT_ROLE.PROSE_H2]: TYPOGRAPHY[TEXT_ROLE.PROSE_H2],
      [TEXT_ROLE.PROSE_H3]: TYPOGRAPHY[TEXT_ROLE.PROSE_H3],
      [TEXT_ROLE.PROSE_H4]: TYPOGRAPHY[TEXT_ROLE.PROSE_H4],
      hero: TYPOGRAPHY[TEXT_ROLE.HERO_TITLE],
      post: TYPOGRAPHY[TEXT_ROLE.POST_TITLE],
      page: TYPOGRAPHY[TEXT_ROLE.PAGE_TITLE],
      section: TYPOGRAPHY[TEXT_ROLE.SECTION_TITLE],
      card: TYPOGRAPHY[TEXT_ROLE.CARD_TITLE],
      'prose-h2': TYPOGRAPHY[TEXT_ROLE.PROSE_H2],
      'prose-h3': TYPOGRAPHY[TEXT_ROLE.PROSE_H3],
      'prose-h4': TYPOGRAPHY[TEXT_ROLE.PROSE_H4],
      preview: ['text-xl font-semibold'],
      copy: ['text-copy'],
    },
    size: {
      [SIZE.XS]: ['text-lg leading-tight tracking-tight'],
      [SIZE.SM]: ['text-xl leading-tight tracking-tight'],
      [SIZE.MD]: ['text-2xl leading-tight tracking-tight'],
      [SIZE.LG]: ['text-3xl leading-tight tracking-tight'],
      [SIZE.XL]: ['text-4xl leading-tight tracking-tight'],
      [SIZE.XXL]: ['text-display leading-[1.05] tracking-tight'],
    },
  },
});

export type THeadingVariants = VariantProps<typeof headingVariants>;
