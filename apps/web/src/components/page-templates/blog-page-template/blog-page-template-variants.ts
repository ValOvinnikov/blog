import { tv } from 'tailwind-variants';

export const blogPageTemplateVariants = tv({
  slots: {
    root: ['w-full'],
    furniture: ['mx-auto w-full', 'max-w-page px-gutter'],
    introHeader: ['mb-6'],
    heading: ['mb-6'],
    supportingText: ['text-muted mb-6'],
    topicChips: ['mb-8'],
    socialLinks: ['mb-10'],
  },
  variants: {
    hasModules: {
      true: {
        furniture: ['pt-page-y', '[&>*:last-child]:mb-0'],
      },
      false: {
        furniture: ['py-page-y'],
      },
    },
  },
  defaultVariants: {
    hasModules: false,
  },
});
