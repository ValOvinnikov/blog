import { tv } from 'tailwind-variants';

export const notFoundPageVariants = tv({
  slots: {
    root: [
      'bg-primary-subtle text-text',
      'flex min-h-dvh flex-col items-center justify-center',
      'gap-6 px-gutter py-section text-center',
    ],
    copy: ['max-w-copy mx-auto'],
    link: [
      'inline-flex items-center gap-1.5',
      'text-brand-primary underline underline-offset-4',
      'transition-colors duration-base ease-smooth',
      'hover:text-brand-primary-hover',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-primary',
    ],
    arrow: ['size-4'],
  },
});
