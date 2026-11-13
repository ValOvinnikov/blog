import { tv } from '@platform/utils/tv/tv';

export const documentValidationTableVariants = tv({
  slots: {
    table: ['mt-2 w-full border-collapse text-left'],
    head: [
      'border-b border-platform-line-2 px-2.5 py-2',
      'text-left text-platform-11 font-bold text-platform-muted uppercase tracking-platform-caps',
    ],
    row: ['border-b border-platform-line-2 last:border-b-0'],
    cell: [
      'px-2.5 py-2 align-top text-platform-12-5 text-platform-text wrap-anywhere',
    ],
    documentType: ['block text-platform-text'],
    documentId: ['block text-platform-12 text-platform-muted'],
  },
});
