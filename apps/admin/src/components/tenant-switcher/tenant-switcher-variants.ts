import { tv } from 'tailwind-variants';

export const tenantSwitcherVariants = tv({
  slots: {
    trigger: [
      'flex w-full items-center gap-2 rounded-md border border-border',
      'bg-surface px-2.5 py-2 text-left',
      'transition-colors duration-base ease-console',
      'hover:border-border-strong',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-secondary',
      'data-[popup-open]:border-brand-primary',
    ],
    meta: ['flex min-w-0 flex-1 flex-col'],
    name: ['truncate text-sm font-medium text-text'],
    domain: ['truncate font-mono text-meta text-text-subtle'],
    chevron: ['shrink-0 rotate-90 text-text-subtle'],
    popup: [
      // Base UI portals this to document.body, outside the sidebar's own
      // `dark` island — carry the flipped token context here too, the same
      // way the sidebar root does, so the popup reads as part of the same
      // control as its (dark) trigger rather than resolving the light
      // `:root` palette by accident of where the portal happens to mount.
      'dark min-w-56 overflow-hidden rounded-md border border-border',
      'bg-surface p-1 shadow-lg outline-none',
    ],
    item: [
      'flex cursor-pointer flex-col rounded-sm px-2 py-1.5 outline-none',
      'data-[highlighted]:bg-secondary',
    ],
    itemName: ['text-sm text-text'],
    itemDomain: ['font-mono text-meta text-text-subtle'],
  },
});
