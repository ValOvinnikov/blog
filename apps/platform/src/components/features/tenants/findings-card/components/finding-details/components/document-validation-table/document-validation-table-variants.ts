import { tv } from '@platform/utils/tv/tv';

export const documentValidationTableVariants = tv({
  slots: {
    table: ['w-full border-collapse text-left'],
    head: [
      'border-b border-admin-line-2 px-2.5 py-2',
      'text-left text-label font-bold text-admin-faint uppercase tracking-[.06em]',
    ],
    row: ['border-b border-admin-line-2 last:border-b-0'],
    cell: ['px-2.5 py-2 align-top text-[12.5px] text-admin-text'],
    documentType: ['block text-admin-text'],
    documentId: ['block text-[11.5px] text-admin-faint'],
  },
});
