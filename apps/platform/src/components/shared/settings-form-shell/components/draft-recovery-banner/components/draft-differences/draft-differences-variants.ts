import { tv } from '@platform/utils/tv/tv';

export const draftDifferencesVariants = tv({
  slots: {
    root: [
      'w-full border-collapse overflow-hidden rounded-admin bg-admin-surface text-left text-admin-13',
    ],
    headCell: [
      'border-b border-admin-line px-3 py-2 text-admin-12 font-medium text-admin-muted',
    ],
    rowHeader: ['px-3 py-2 align-top font-medium'],
    cell: ['px-3 py-2 align-top break-words whitespace-pre-wrap'],
    row: ['border-b border-admin-line last:border-b-0'],
    empty: ['text-admin-muted italic'],
  },
});
