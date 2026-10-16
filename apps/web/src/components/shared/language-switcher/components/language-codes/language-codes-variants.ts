import { tv } from 'tailwind-variants';

export const languageCodesVariants = tv({
  slots: {
    list: ['flex items-center'],
    link: ['font-mono'],
    label: ['sr-only'],
  },
  variants: {
    isInFooter: {
      false: {
        list: ['gap-0.5 rounded-full border border-border-strong p-0.5'],
        link: [
          'h-6 min-w-6 justify-center rounded-full px-1.5 pb-0 text-label no-underline',
        ],
      },
      true: {
        list: ['gap-2'],
        link: ['text-meta'],
      },
    },
    isCurrent: {
      true: { link: ['cursor-default'] },
      false: {},
    },
  },
  compoundVariants: [
    {
      isInFooter: false,
      isCurrent: true,
      class: {
        link: [
          'bg-brand-primary text-brand-primary-contrast',
          'hover:text-brand-primary-contrast',
        ],
      },
    },
    {
      isInFooter: true,
      isCurrent: true,
      class: { link: ['hover:text-brand-primary'] },
    },
  ],
});
