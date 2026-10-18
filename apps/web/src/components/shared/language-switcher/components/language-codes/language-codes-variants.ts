import { HEADER_CONTROL_FRAME } from '@blog/ui/lib/styling';
import { tv } from 'tailwind-variants';

export const languageCodesVariants = tv({
  slots: {
    list: ['flex'],
    link: ['font-mono'],
    label: ['sr-only'],
  },
  variants: {
    isInFooter: {
      false: {
        list: [
          HEADER_CONTROL_FRAME,
          'items-center gap-0.5 p-[5px] pointer-coarse:p-[9px]',
        ],
        link: [
          'h-6 min-w-6 justify-center rounded-full px-1.5 pb-0 text-label no-underline',
        ],
      },
      true: {
        list: ['items-baseline gap-2'],
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
          'forced-colors:outline forced-colors:outline-1 forced-colors:-outline-offset-1 forced-colors:outline-[Highlight]',
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
