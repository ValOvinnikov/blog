import { tv } from '@platform/utils/tv/tv';

export const navItemContentVariants = tv({
  slots: {
    // The icon reads `aria-current` off its ancestor row via `group-aria-*`, not a state prop.
    rowIcon: [
      'text-admin-side-muted transition-colors duration-base ease-smooth',
      'group-aria-[current=page]:text-admin-text-strong',
    ],
    // `sr-only`, not `hidden`, so the label stays the row's accessible name when collapsed.
    rowBody: [
      'flex min-w-0 flex-1 flex-col',
      'group-data-[collapsed=true]/shell:sr-only',
    ],
    rowLabel: ['truncate'],
    rowReason: ['text-admin-12 leading-4 text-admin-side-muted'],
    badgeSlot: [
      'ml-auto shrink-0',
      'group-data-[collapsed=true]/shell:sr-only',
    ],
  },
});
