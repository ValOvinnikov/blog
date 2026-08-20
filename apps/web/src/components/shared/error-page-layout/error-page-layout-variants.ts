import { tv } from 'tailwind-variants';

export const errorPageLayoutVariants = tv({
  slots: {
    root: [
      'bg-primary-subtle text-text',
      'flex min-h-dvh flex-col items-center justify-center',
      'gap-6 px-gutter py-section text-center',
      // `ring-inset`, not `buttonVariants`' `ring-offset-2` — this is a
      // full-viewport container, and an offset ring would render outside it.
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary',
    ],
    copy: ['max-w-copy mx-auto'],
    actions: ['flex items-center gap-3'],
    announcement: ['sr-only'],
  },
});
