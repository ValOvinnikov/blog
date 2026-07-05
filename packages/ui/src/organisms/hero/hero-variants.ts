import { tv } from 'tailwind-variants';

export const heroVariants = tv({
  slots: {
    root: [
      'flex flex-col',
      'rounded-lg overflow-hidden',
      'bg-surface border border-border',
    ],
    content: ['flex flex-col gap-4', 'p-6 md:p-8'],
    meta: ['font-sans text-sm', 'text-text-muted'],
    title: [],
    excerpt: [
      'font-sans text-base leading-relaxed',
      'text-text-muted',
      'max-w-prose',
    ],
    tags: ['flex flex-wrap gap-2'],
  },
});
