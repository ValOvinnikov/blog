import { tv } from '@platform/utils/tv/tv';

export const lookSampleBreadcrumbsVariants = tv({
  slots: {
    root: ['w-full'],
    inner: [
      'mx-auto w-full max-w-(--sample-page-width) px-5 py-2.5 @[40rem]:px-8',
    ],
  },
  variants: {
    isPlain: {
      true: { root: ['bg-primary-subtle'] },
      false: { root: ['border-b border-divider bg-ambient text-text'] },
    },
  },
});
