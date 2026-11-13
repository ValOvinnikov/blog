import { tv } from '@platform/utils/tv/tv';

export const runErrorCardVariants = tv({
  slots: {
    title: ['flex items-center gap-2'],
    titleIcon: ['flex-none'],
    content: ['flex flex-col gap-3'],
    details: ['mt-1'],
    detailsText: [
      'mt-2 rounded-platform-control bg-platform-surface-2 p-3',
      'font-mono text-platform-12-5 text-platform-muted whitespace-pre-wrap break-words',
    ],
  },
});
