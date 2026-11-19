import { tv } from '@platform/utils/tv/tv';

export const lookSampleBannerVariants = tv({
  slots: {
    root: [
      'relative isolate grid min-h-64 content-center overflow-hidden',
      'skin-raised skin-on-image bg-ambient text-text',
    ],
    copy: [
      'mx-auto flex w-full max-w-(--sample-page-width) flex-col gap-3',
      'px-5 py-12 @[40rem]:px-8',
    ],
  },
});
