import { HEADER_CONTROL_FRAME, tv } from '@blog/ui/lib/styling';

export const languageCodesVariants = tv({
  slots: {
    list: ['flex'],
    link: ['font-mono'],
    label: ['sr-only'],
  },
  variants: {
    isInFooter: {
      false: {
        list: [HEADER_CONTROL_FRAME, 'items-center gap-0.5 p-[5px]'],
        link: [
          'h-8 min-w-8 justify-center rounded-header-control px-1.5 pb-0 text-label no-underline',
          'lg:h-6 lg:min-w-6 pointer-coarse:h-8 pointer-coarse:min-w-8',
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
