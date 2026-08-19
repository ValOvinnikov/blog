import { tv } from 'tailwind-variants';

export const bookmarksPageVariants = tv({
  slots: {
    root: ['mx-auto w-full', 'max-w-page px-gutter py-page-y'],
    heading: ['mb-4'],
    chrome: ['mt-6'],
    prefix: ['text-subtle'],
    plainRoot: ['mt-6'],
    plainList: ['flex flex-col gap-3'],
    plainRow: [
      'flex flex-wrap items-baseline justify-between gap-2 py-2',
      'border-b border-border last:border-b-0',
    ],
    plainLink: [
      'text-copy text-brand-primary underline underline-offset-4',
      'hover:text-brand-primary-hover',
    ],
    plainDate: ['text-meta text-subtle'],
    plainHint: ['mt-4'],
  },
});
