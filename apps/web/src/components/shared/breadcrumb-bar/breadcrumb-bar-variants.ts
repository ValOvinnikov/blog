import { tv } from 'tailwind-variants';

export const breadcrumbBarVariants = tv({
  slots: {
    root: ['w-full', 'bg-bg border-b border-border-strong'],
    inner: ['mx-auto max-w-page px-gutter py-2.5'],
  },
});
