import { tv } from 'tailwind-variants';

export const sidebarVariants = tv({
  slots: {
    root: [
      'w-full shrink-0 border-b border-border bg-secondary',
      'md:min-h-dvh md:w-64 md:border-r md:border-b-0',
      'flex flex-col gap-1 px-3 py-4',
    ],
    brand: ['flex flex-col gap-0.5 px-2 pb-3'],
    brandName: ['font-display text-base font-semibold text-text'],
    brandMeta: ['font-mono text-meta text-text-subtle'],
    switcherSlot: ['px-1 pb-3'],
    section: ['flex flex-col gap-1 pt-3 first-of-type:pt-0'],
    sectionLabel: [
      'px-2 pb-1.5 font-mono text-meta font-semibold tracking-wide text-text-subtle uppercase',
    ],
    list: ['flex flex-col gap-0.5'],
    link: [
      'block rounded-sm px-2 py-1.5 text-sm text-text-muted',
      'transition-colors duration-base ease-console',
      'hover:bg-surface hover:text-text',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
    ],
    note: ['px-2 text-xs text-text-subtle'],
  },
});
