import { tv } from '@platform/utils/tv/tv';

export const lookSampleBandVariants = tv({
  slots: {
    root: ['bg-ambient text-text'],
    inner: [
      'mx-auto grid w-full max-w-(--sample-page-width) gap-6',
      'px-5 py-10 @[40rem]:px-8',
      '@[40rem]:grid-cols-2 @[40rem]:items-center',
    ],
    copy: ['flex flex-col gap-3'],
  },
});
