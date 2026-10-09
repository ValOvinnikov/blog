import { tv } from '@platform/utils/tv/tv';

export const lookFormVariants = tv({
  slots: {
    columns: ['grid grid-cols-1 items-start gap-6 lg:grid-cols-2'],
    editPanel: ['flex flex-col gap-6'],
    // 68px clears the sticky topbar; 160px also leaves room for the save bar below.
    previewPanel: [
      'lg:sticky lg:top-[68px] lg:-m-1 lg:max-h-[calc(100dvh-160px)] lg:self-start lg:overflow-y-auto lg:overscroll-contain lg:p-1',
    ],
  },
  variants: {
    isActive: {
      false: { editPanel: ['max-lg:hidden'], previewPanel: ['max-lg:hidden'] },
    },
  },
});
