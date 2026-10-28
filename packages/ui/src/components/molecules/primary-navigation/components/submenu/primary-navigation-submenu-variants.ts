import { HEADER_SUBMENU_STYLE } from '@blog/config';
import {
  BELOW_HEADER,
  FOCUS_RING,
  TRANSITION_COLORS,
  tv,
} from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const primaryNavigationSubmenuVariants = tv({
  slots: {
    trigger: [
      'group inline-flex cursor-pointer items-center gap-x-1 rounded-sm',
      'font-mono text-meta',
      TRANSITION_COLORS,
      FOCUS_RING,
      'has-[+:popover-open]:text-brand-primary',
    ],
    chevron: ['transition-transform group-has-[+:popover-open]:rotate-180'],
    panel: [
      'border border-border bg-surface text-text shadow-float',
      'font-display text-copy',
      'open:block',
    ],
    body: ['flex flex-col'],
    lead: ['font-semibold'],
    separator: ['mx-1 my-1.5 border-t border-border'],
    rest: ['flex flex-col'],
    item: [
      'flex items-center justify-between gap-2.5',
      'rounded-md px-3 py-2 hover:bg-surface-2',
    ],
  },
  variants: {
    isActive: {
      true: { trigger: ['font-semibold text-brand-primary'] },
      false: { trigger: ['text-muted hover:text-text'] },
    },
    submenuStyle: {
      [HEADER_SUBMENU_STYLE.DROPDOWN]: {
        panel: [
          'w-65 rounded-card p-2',
          'supports-[anchor-name:--a]:inset-auto supports-[anchor-name:--a]:m-0',
          'supports-[anchor-name:--a]:top-[anchor(bottom)] supports-[anchor-name:--a]:left-[anchor(left)]',
          'supports-[anchor-name:--a]:mt-5 supports-[anchor-name:--a]:-ml-3',
          'supports-[anchor-name:--a]:[position-try-fallbacks:flip-inline]',
        ],
      },
      [HEADER_SUBMENU_STYLE.WIDE_PANEL]: {
        panel: ['rounded-b-card border-t-0', BELOW_HEADER],
        body: [
          'mx-auto grid max-w-page grid-cols-[16rem_1fr] gap-x-8',
          'px-gutter py-6',
        ],
        lead: ['self-start justify-start gap-2 text-lg'],
        separator: ['hidden'],
        rest: ['block columns-3 gap-x-8'],
        item: ['break-inside-avoid px-0 py-1.5 hover:bg-transparent'],
      },
    },
  },
  defaultVariants: {
    isActive: false,
    submenuStyle: HEADER_SUBMENU_STYLE.DROPDOWN,
  },
});

export type TPrimaryNavigationSubmenuVariants = VariantProps<
  typeof primaryNavigationSubmenuVariants
>;
