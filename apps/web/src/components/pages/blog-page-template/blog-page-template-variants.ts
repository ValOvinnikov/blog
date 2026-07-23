import { tv } from 'tailwind-variants';

export const blogPageTemplateVariants = tv({
  slots: {
    root: ['bg-bg mx-auto w-full', 'max-w-page px-gutter py-page-y'],
    introHeader: 'mb-6',
    heading: 'mb-6',
    supportingText: 'text-muted mb-6',
    socialLinks: 'mb-10',
  },
});
