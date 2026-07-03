import { tv } from 'tailwind-variants';

export const footerVariants = tv({
  slots: {
    root: [
      'flex flex-col items-center gap-gutter',
      'px-gutter py-6',
      'bg-bg border-t border-border',
    ],
    nav: ['flex flex-wrap items-center justify-center gap-gutter'],
    copyright: ['font-sans text-sm', 'text-text-muted'],
  },
});
