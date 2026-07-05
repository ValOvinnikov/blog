import { tv } from 'tailwind-variants';

export const heroVariants = tv({
  slots: {
    root: ['py-6 md:py-10'],
    content: ['flex flex-col gap-4'],
    eyebrow: [
      'font-mono text-xs font-medium',
      'tracking-[.14em] uppercase',
      'text-accent',
    ],
    meta: ['font-mono text-xs', 'text-text-subtle'],
    title: [],
    excerpt: ['text-base leading-[1.6]', 'text-text-muted', 'max-w-[52ch]'],
    tags: ['flex flex-wrap gap-2', 'mt-2'],
  },
});
