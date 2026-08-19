import { tv } from 'tailwind-variants';

export const errorPageVariants = tv({
  slots: {
    root: [
      'bg-primary-subtle text-text',
      'flex min-h-dvh flex-col items-center justify-center',
      'gap-6 px-gutter py-section text-center',
    ],
    copy: ['max-w-copy mx-auto'],
    actions: ['flex items-center gap-3'],
  },
});
