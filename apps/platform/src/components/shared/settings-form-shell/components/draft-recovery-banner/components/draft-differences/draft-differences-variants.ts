import { tv } from '@platform/utils/tv/tv';

export const draftDifferencesVariants = tv({
  slots: {
    root: [
      'w-full border-collapse overflow-hidden rounded-platform bg-platform-surface text-left text-platform-13',
    ],
    headCell: [
      'border-b border-platform-line px-3 py-2 text-platform-12 font-medium text-platform-muted',
    ],
    rowHeader: ['px-3 py-2 align-top font-medium'],
    cell: ['px-3 py-2 align-top break-words whitespace-pre-wrap'],
    row: ['border-b border-platform-line last:border-b-0'],
    empty: ['text-platform-muted italic'],
  },
});
