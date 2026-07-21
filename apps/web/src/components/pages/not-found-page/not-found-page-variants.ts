import { tv } from 'tailwind-variants';

export const notFoundPageVariants = tv({
  slots: {
    root: [
      'bg-bg text-text',
      'flex min-h-dvh flex-col items-center justify-center',
      'gap-6 px-gutter py-section text-center',
    ],
    chip: 'mx-auto',
    copy: 'max-w-copy mx-auto',
  },
});
