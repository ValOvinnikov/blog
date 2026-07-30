import { tv } from 'tailwind-variants';

export const homePageTemplateVariants = tv({
  slots: {
    root: ['w-full'],
    modules: ['mx-auto w-full', 'max-w-page px-gutter py-page-y'],
  },
});
