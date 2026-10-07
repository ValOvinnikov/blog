import { tv } from 'tailwind-variants';

export const breadcrumbBarVariants = tv({
  slots: {
    root: ['w-full'],
    inner: ['mx-auto max-w-page px-gutter py-2.5'],
  },
  variants: {
    isAbovePageHeading: {
      true: { root: ['bg-primary-subtle'] },
      false: { root: ['bg-primary border-b border-border-strong'] },
    },
  },
  defaultVariants: {
    isAbovePageHeading: false,
  },
});
