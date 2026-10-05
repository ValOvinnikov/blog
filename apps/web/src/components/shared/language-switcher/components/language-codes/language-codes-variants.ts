import { tv } from 'tailwind-variants';

export const languageCodesVariants = tv({
  slots: {
    list: ['flex items-center'],
    link: ['font-mono'],
  },
  variants: {
    isInFooter: {
      false: {
        list: ['gap-0.5 rounded-full border border-border-strong p-0.5'],
        link: [
          'h-6 min-w-6 justify-center rounded-full px-1.5 text-label',
          'aria-[current=page]:bg-brand-primary',
          'aria-[current=page]:text-brand-primary-contrast',
          'aria-[current=page]:hover:text-brand-primary-contrast',
        ],
      },
      true: {
        list: ['gap-2'],
        link: ['text-meta'],
      },
    },
  },
});
