import { tv } from '@platform/utils/tv/tv';

export const lookSampleVariants = tv({
  slots: {
    root: ['flex grow flex-col rounded-none border-0 p-0'],
    main: [
      'mx-auto flex w-full max-w-[70rem] grow flex-col gap-8',
      'px-5 pt-9 pb-12 @[40rem]:px-8 @[64rem]:pt-14',
    ],
    hero: ['flex max-w-[40rem] flex-col gap-3.5'],
    title: [
      'text-[2rem] leading-[1.12] tracking-[-0.5px]',
      '@[40rem]:text-[2.375rem] @[64rem]:text-[2.75rem]',
    ],
    lead: ['text-[1.0625rem] leading-[1.6]'],
    actionsRow: ['flex flex-wrap items-center gap-2.5 pt-1.5'],
  },
});
