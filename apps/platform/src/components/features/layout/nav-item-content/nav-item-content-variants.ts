import { tv } from '@platform/utils/tv/tv';

export const navItemContentVariants = tv({
  slots: {
    // The icon reads `aria-current` off its ancestor row via `group-aria-*`, not a state prop.
    rowIcon: [
      'opacity-75 transition-opacity duration-base ease-smooth',
      'group-aria-[current=page]:text-admin-side-accent group-aria-[current=page]:opacity-100',
    ],
    // `sr-only`, not `hidden`, so the label stays the row's accessible name when collapsed.
    rowBody: [
      'flex min-w-0 flex-1 flex-col',
      'group-data-[collapsed=true]/shell:sr-only',
    ],
    rowLabel: ['truncate'],
    rowReason: ['truncate text-[11px] text-admin-faint'],
    // Hidden outright (not sr-only) — the badge has no room on the collapsed rail.
    badgeSlot: ['ml-auto shrink-0', 'group-data-[collapsed=true]/shell:hidden'],
  },
});
