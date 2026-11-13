import { tv } from '@platform/utils/tv/tv';

export const liveSiteBlockVariants = tv({
  slots: {
    root: [
      'flex flex-col gap-3 md:flex-row md:items-center md:gap-4',
      'border-b border-platform-line-2 px-platform-card py-4',
    ],
    summary: ['flex min-w-0 flex-1 items-start gap-3'],
    text: ['flex min-w-0 flex-col'],
    title: ['text-platform-13-5 leading-5 font-semibold text-platform-text'],
    address: [
      'font-platform-mono text-platform-13 leading-5 text-platform-muted',
      'break-all',
    ],
    actions: ['flex items-center gap-2 md:flex-none'],
    openSite: ['flex-1 justify-center md:flex-none'],
  },
});
