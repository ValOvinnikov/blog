import { tv } from '@platform/utils/tv/tv';

export const lookFormVariants = tv({
  slots: {
    columns: ['grid grid-cols-1 items-start gap-6 lg:grid-cols-2'],
    editPanel: ['flex flex-col gap-6'],
    previewPanel: ['lg:sticky lg:top-admin-topbar lg:self-start'],
  },
  variants: {
    isActive: {
      false: { editPanel: ['max-lg:hidden'], previewPanel: ['max-lg:hidden'] },
    },
  },
});
