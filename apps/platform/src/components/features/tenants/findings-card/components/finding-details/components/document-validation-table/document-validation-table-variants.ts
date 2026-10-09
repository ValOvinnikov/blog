import { tv } from '@platform/utils/tv/tv';

export const documentValidationTableVariants = tv({
  slots: {
    table: ['mt-2 w-full border-collapse text-left'],
    head: [
      'border-b border-admin-line-2 px-2.5 py-2',
      'text-left text-[11px] font-bold text-admin-muted uppercase tracking-[.06em]',
    ],
    row: ['border-b border-admin-line-2 last:border-b-0'],
    cell: ['px-2.5 py-2 align-top text-[12.5px] text-admin-text wrap-anywhere'],
    documentType: ['block text-admin-text'],
    documentId: ['block text-[12px] text-admin-muted'],
  },
});
