import { TEXT_ROLE } from '@shinefold/config';
import { MENU_ROW, tv, TYPOGRAPHY } from '@shinefold/ui/lib/styling';

export const accountMenuGroupVariants = tv({
  slots: {
    group: ['group/account w-full'],
    row: [
      'group flex min-h-11 w-full cursor-pointer list-none items-center gap-2 px-3',
      TYPOGRAPHY[TEXT_ROLE.META],
      'text-text',
      '[&::-webkit-details-marker]:hidden',
      ...MENU_ROW,
    ],
    glyph: [
      'text-muted',
      'group-hover:text-brand-primary group-focus-visible:text-brand-primary',
    ],
    chevron: [
      'ms-auto text-muted',
      'motion-safe:transition-transform motion-safe:duration-fast',
      'group-open/account:rotate-180',
    ],
    panel: [
      'static mt-1 w-full min-w-0',
      'border-0 bg-transparent shadow-none',
    ],
  },
});
