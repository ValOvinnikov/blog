import { tv } from '@platform/utils/tv/tv';

export const lookFormVariants = tv({
  slots: {
    columns: ['grid grid-cols-1 items-start gap-6 lg:grid-cols-2'],
    editPanel: ['flex flex-col gap-6'],
    // 160px leaves room for the topbar above and the save bar below.
    previewPanel: [
      'lg:sticky lg:top-admin-topbar lg:-m-1 lg:max-h-[calc(100dvh-160px)] lg:self-start lg:overflow-y-auto lg:overscroll-contain lg:p-1',
    ],
  },
  variants: {
    isActive: {
      false: { editPanel: ['max-lg:hidden'], previewPanel: ['max-lg:hidden'] },
    },
  },
});
