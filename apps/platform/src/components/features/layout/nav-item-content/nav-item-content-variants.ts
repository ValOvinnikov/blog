import { tv } from '@platform/utils/tv/tv';

export const navItemContentVariants = tv({
  slots: {
    // `aria-current="page"` lands on the row itself (the link `SidebarNavLink`
    // renders, or never, for the static inert row) — the icon reads it off
    // its own ancestor via `group-aria-*` rather than a separate state prop.
    rowIcon: [
      'opacity-75 transition-opacity duration-base ease-smooth',
      'group-aria-[current=page]:text-admin-side-accent group-aria-[current=page]:opacity-100',
    ],
    // `sr-only` (not `hidden`) when collapsed — the label is the row's only
    // accessible name, so it must stay in the accessibility tree even once
    // it's visually gone.
    rowBody: [
      'flex min-w-0 flex-1 flex-col',
      'group-data-[collapsed=true]/shell:sr-only',
    ],
    rowLabel: ['truncate'],
    rowReason: ['truncate text-[11px] text-admin-faint'],
    // Unlike the label, the badge is a supplementary status marker with no
    // room on the collapsed rail — hidden outright rather than `sr-only`.
    badgeSlot: ['ml-auto shrink-0', 'group-data-[collapsed=true]/shell:hidden'],
  },
});
