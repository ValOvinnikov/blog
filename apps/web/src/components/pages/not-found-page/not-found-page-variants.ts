import { tv } from 'tailwind-variants';

export const notFoundPageVariants = tv({
  slots: {
    root: [
      'bg-primary-subtle text-text',
      'flex min-h-dvh flex-col items-center justify-center',
      'gap-6 px-gutter py-section text-center',
    ],
    chip: ['mx-auto'],
    copy: ['max-w-copy mx-auto'],
    plainCopy: ['mx-auto'],
    plainLink: [
      'inline-flex items-center gap-1.5',
      'text-brand-primary underline underline-offset-4',
      'transition-colors duration-base ease-console',
      'hover:text-brand-primary-hover',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-primary',
    ],
    plainArrow: ['size-4'],
  },
});

export const notFoundLinkVariants = tv({
  slots: {
    root: [
      'group inline-flex items-center gap-1.5',
      'border-b border-brand-primary pb-[3px]',
      'font-mono text-copy',
      'transition-colors duration-base ease-console',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-primary',
    ],
    prompt: ['select-none text-subtle'],
    command: ['text-brand-primary', 'group-hover:text-brand-primary-hover'],
    arrow: [
      'text-brand-primary opacity-60',
      'transition-transform duration-base ease-console',
      'group-hover:translate-x-0.5',
    ],
  },
});
