import { tv } from 'tailwind-variants';

export const sidebarNavVariants = tv({
  slots: {
    // `sticky` lives on `root`, not `mobile` — `mobile`'s own parent box has no room to pin. `top-20` leaves a gap below the Header so the shadow reads as separation, not flush.
    root: [
      'w-full min-w-0',
      'sticky top-20 z-10',
      'lg:static lg:top-auto lg:z-auto',
    ],
    desktop: [
      'hidden lg:block',
      'lg:sticky lg:top-24',
      'lg:border-r lg:border-border lg:pr-6',
    ],
    // `shadow-md`: this bar shares `Header`'s background and border, so the hairline alone doesn't read as a seam once it sticks beneath it.
    mobile: [
      'relative',
      'bg-primary border-b border-border shadow-md',
      'px-4 py-3',
      'mb-6',
      'lg:hidden',
    ],
    desktopLabel: [
      'mb-3 block',
      'font-mono text-label tracking-label uppercase text-text',
    ],
    selectorRow: [
      'flex flex-col gap-1.5',
      'md:flex-row md:items-center md:gap-3',
    ],
    mobileLabel: [
      'shrink-0',
      'font-mono text-label tracking-label uppercase text-subtle',
    ],
    toggle: [
      'flex w-full min-w-0 items-center justify-between gap-2',
      'md:flex-1',
      'border border-border rounded-md bg-primary px-3 py-2.5',
      'font-mono text-copy text-text',
      'cursor-pointer text-left',
      'transition-colors duration-base ease-smooth',
      'hover:bg-surface-2',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-ambient',
    ],
    toggleLabel: ['flex-1 truncate'],
    chevron: [
      'size-1.5 shrink-0 rotate-45 border-r-2 border-b-2 border-current',
      'transition-transform duration-base ease-smooth',
    ],
    // `p-4` matches the nav-menu and share-post popover panels so all three read as one system.
    panel: [
      'absolute inset-x-0 top-full',
      'bg-primary border-b border-border shadow-lg',
      'max-h-[70vh] overflow-y-auto p-4',
    ],
    list: ['flex flex-col gap-1', 'font-mono text-copy', 'm-0 list-none p-0'],
    item: [],
    link: [
      'block text-subtle no-underline',
      'transition-colors duration-base ease-smooth',
      'hover:text-brand-primary',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-ambient',
    ],
  },
  variants: {
    open: {
      true: { chevron: ['-rotate-135'] },
    },
    isActive: {
      true: { link: ['text-brand-primary'] },
    },
    isNested: {
      true: { item: ['pl-3'] },
    },
    inPanel: {
      true: {
        link: ['flex items-center rounded-md px-3 py-2', 'hover:bg-surface-2'],
      },
    },
  },
});
