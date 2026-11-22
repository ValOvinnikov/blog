import { tv } from '@platform/utils/tv/tv';

export const subscribersEmptyCardVariants = tv({
  slots: {
    body: ['flex flex-col items-center gap-3 px-8 py-14 text-center'],
    tile: [
      'flex size-14 items-center justify-center rounded-platform',
      'bg-platform-brand-weak text-platform-brand',
    ],
    icon: ['size-6.5'],
    title: ['m-0 text-platform-20 font-semibold'],
    description: [
      'm-0 max-w-[460px] text-platform-14 leading-normal text-platform-muted',
    ],
    action: ['mt-2'],
  },
});
