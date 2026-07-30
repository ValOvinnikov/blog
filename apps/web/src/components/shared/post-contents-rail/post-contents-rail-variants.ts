import { tv } from 'tailwind-variants';

export const postContentsRailVariants = tv({
  slots: {
    root: ['w-full min-w-0'],
    desktop: [
      'hidden lg:block',
      'lg:sticky lg:top-24',
      'lg:border-r lg:border-border lg:pr-6',
    ],
    mobile: ['border-b border-border mb-6', 'lg:hidden'],
    desktopLabel: [
      'mb-3 block',
      'font-mono text-label tracking-label uppercase text-text',
    ],
    toggle: [
      'flex w-full items-center gap-2 py-3',
      'font-mono text-label tracking-label uppercase text-text',
      'cursor-pointer border-0 bg-transparent p-0 text-left',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    ],
    toggleLabel: ['flex-1'],
    chevron: [
      'size-1.5 shrink-0 rotate-45 border-r-2 border-b-2 border-current',
      'transition-transform duration-base ease-console',
    ],
    panel: ['pb-4'],
    list: ['flex flex-col gap-2', 'font-mono text-copy', 'm-0 list-none p-0'],
    item: [],
    link: [
      'block text-subtle no-underline',
      'transition-colors duration-base ease-console',
      'hover:text-accent',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    ],
  },
  variants: {
    open: {
      true: { chevron: ['-rotate-135'] },
    },
    isActive: {
      true: { link: ['text-accent'] },
    },
    isSubheading: {
      true: { item: ['pl-3'] },
    },
  },
});
