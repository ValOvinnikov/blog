import { tv } from '@platform/utils/tv/tv';

export const lookSampleVariants = tv({
  slots: {
    root: [
      'flex grow flex-col rounded-none border-0 p-0',
      '[--sample-page-width:70rem]',
    ],
    main: [
      'mx-auto flex w-full max-w-(--sample-page-width) grow flex-col gap-8',
      'px-5 pt-9 pb-12 @[40rem]:px-8 @[64rem]:pt-14',
    ],
    hero: ['flex max-w-[40rem] flex-col gap-3.5'],
    divider: ['border-0 border-t-[length:var(--divider-width)] border-border'],
  },
});
