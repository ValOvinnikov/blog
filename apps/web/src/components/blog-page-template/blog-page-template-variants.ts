import { tv } from 'tailwind-variants';

export const blogPageTemplateVariants = tv({
  slots: {
    root: ['bg-bg mx-auto w-full', 'max-w-page px-gutter py-page-y'],
    heading: 'mb-6',
  },
});
