import { tv } from '@shinefold/ui/lib/styling';

export const breadcrumbBarVariants = tv({
  slots: {
    root: ['hidden w-full md:block'],
    inner: ['mx-auto max-w-page px-gutter py-2.5'],
  },
  variants: {
    isAbovePageHeading: {
      true: {},
      false: {},
    },
    isPlain: {
      true: {},
      false: { root: ['bg-ambient text-text border-b border-divider'] },
    },
  },
  compoundVariants: [
    {
      isPlain: true,
      isAbovePageHeading: true,
      class: { root: ['bg-primary-subtle'] },
    },
    {
      isPlain: true,
      isAbovePageHeading: false,
      class: { root: ['bg-primary border-b border-border-strong'] },
    },
  ],
  defaultVariants: {
    isAbovePageHeading: false,
    isPlain: true,
  },
});
