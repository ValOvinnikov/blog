import { tv } from '@platform/utils/tv/tv';

export const runErrorCardVariants = tv({
  slots: {
    cardBorder: ['border-admin-bad/30'],
    cardHeader: ['border-admin-bad/20'],
    cardTitle: ['flex items-center gap-2 text-admin-bad'],
    titleIcon: ['flex-none'],
    content: ['flex flex-col gap-3'],
    details: ['mt-1'],
    detailsText: [
      'mt-2 rounded-admin-control bg-admin-surface-2 p-3',
      'font-mono text-xs text-admin-muted whitespace-pre-wrap break-words',
    ],
  },
});
