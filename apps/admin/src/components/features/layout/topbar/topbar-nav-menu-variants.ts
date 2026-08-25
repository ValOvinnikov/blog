import { tv } from 'tailwind-variants';

export const topbarNavMenuVariants = tv({
  slots: {
    trigger: [
      'md:hidden',
      'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
      'border border-border bg-surface text-text-muted',
      'transition-colors duration-base ease-console',
      'hover:border-border-strong hover:text-text',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-primary',
      'data-[popup-open]:border-brand-primary data-[popup-open]:text-text',
    ],
    popup: [
      // Base UI portals this to document.body, outside the topbar's light
      // context — carry the flipped token context here too, the same way
      // the sidebar root and its own tenant-switcher popup do, so this
      // popup reads as the same dark rail moved into a menu rather than
      // resolving the light `:root` palette by accident of where the
      // portal happens to mount.
      'dark w-72 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-md border',
      'border-border bg-primary py-2 shadow-lg outline-none',
      // Bounded by Base UI's own collision-aware available space so the
      // popup never grows past the viewport and covers page content —
      // scrolls internally instead.
      'max-h-[var(--available-height)]',
    ],
  },
});
