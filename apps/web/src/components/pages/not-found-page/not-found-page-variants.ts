import { tv } from 'tailwind-variants';

export const notFoundPageVariants = tv({
  slots: {
    root: [
      'bg-bg-subtle text-text',
      'flex min-h-dvh flex-col items-center justify-center',
      'gap-6 px-gutter py-section text-center',
    ],
    chip: 'mx-auto',
    copy: 'max-w-copy mx-auto',
  },
});

export const notFoundLinkVariants = tv({
  slots: {
    root: [
      'group inline-flex items-center gap-1.5',
      'border-b border-accent pb-[3px]',
      'font-mono text-copy',
      'transition-colors duration-base ease-console',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    ],
    prompt: ['select-none text-subtle'],
    command: ['text-accent', 'group-hover:text-accent-hover'],
    arrow: [
      'text-accent opacity-60',
      'transition-transform duration-base ease-console',
      'group-hover:translate-x-0.5',
    ],
  },
});
