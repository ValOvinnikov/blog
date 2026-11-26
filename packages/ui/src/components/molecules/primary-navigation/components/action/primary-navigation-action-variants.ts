import { HEADER_ACTION_STYLE } from '@shinefold/config';
import { PANEL_LINK } from '@shinefold/ui/components/molecules/primary-navigation/primary-navigation-variants';
import { NAV_LINK, tv } from '@shinefold/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const primaryNavigationActionVariants = tv({
  base: ['shrink-0 whitespace-nowrap'],
  variants: {
    style: {
      [HEADER_ACTION_STYLE.FILLED]: [],
      [HEADER_ACTION_STYLE.OUTLINED]: [],
      [HEADER_ACTION_STYLE.PLAIN]: [],
    },
    isInPanel: {
      true: [],
      false: [],
    },
  },
  compoundVariants: [
    {
      style: [HEADER_ACTION_STYLE.FILLED, HEADER_ACTION_STYLE.OUTLINED],
      isInPanel: true,
      class: ['mb-2 w-full'],
    },
    {
      style: HEADER_ACTION_STYLE.PLAIN,
      isInPanel: false,
      class: [NAV_LINK],
    },
    {
      style: HEADER_ACTION_STYLE.PLAIN,
      isInPanel: true,
      class: PANEL_LINK,
    },
  ],
  defaultVariants: {
    style: HEADER_ACTION_STYLE.FILLED,
    isInPanel: false,
  },
});

export type TPrimaryNavigationActionVariants = VariantProps<
  typeof primaryNavigationActionVariants
>;
