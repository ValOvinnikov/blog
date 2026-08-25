import { tv } from 'tailwind-variants';

export const sidebarVariants = tv({
  slots: {
    root: [
      // Deliberate dark island: the rail stays dark against an otherwise
      // light admin panel, so it carries its own flipped token context
      // rather than the app-wide `.dark` class.
      // Hidden below `md:` — mobile nav lives in Topbar's compact menu
      // instead (TopbarNavMenu), never this unbounded full-height stack.
      'dark hidden w-full shrink-0 flex-col border-b border-border bg-primary',
      'md:flex md:min-h-dvh md:w-64 md:border-r md:border-b-0',
      'md:sticky md:top-0 md:self-start',
    ],
    brand: ['flex items-center gap-2.5 border-b border-border px-3 py-4'],
    brandMeta: ['flex min-w-0 flex-col'],
    brandName: ['font-display text-base font-semibold text-text'],
    brandTagline: ['font-mono text-meta text-text-subtle'],
    switcherSlot: ['px-3 pt-3 pb-2'],
    section: ['flex flex-col gap-1 px-3 pt-4 first-of-type:pt-3'],
    sectionLabel: [
      'px-2 pb-1.5 font-mono text-meta font-semibold tracking-wide text-text-subtle uppercase',
    ],
    list: ['flex flex-col gap-0.5'],
    row: [
      'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm',
      'transition-colors duration-base ease-console',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
    ],
    rowBody: ['flex min-w-0 flex-1 flex-col'],
    rowLabel: ['truncate'],
    rowReason: ['truncate font-mono text-meta text-text-subtle'],
    badgeSlot: ['ml-auto shrink-0'],
    note: ['px-2 text-xs text-text-subtle'],
  },
  variants: {
    state: {
      active: { row: ['bg-surface text-text'] },
      resting: {
        row: ['text-text-muted', 'hover:bg-surface hover:text-text'],
      },
      // Not dimmed: the label is the only way to learn this destination's
      // name, so it stays at full (muted) legibility — the badge carries
      // the "not available yet" signal instead.
      inert: { row: ['text-text-muted'] },
    },
  },
  defaultVariants: {
    state: 'resting',
  },
});
