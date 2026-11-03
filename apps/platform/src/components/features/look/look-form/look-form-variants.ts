import { tv } from '@platform/utils/tv/tv';

export const lookFormVariants = tv({
  slots: {
    layout: ['@container flex flex-col gap-admin-form-gap max-lg:gap-3.5'],
    columns: [
      'flex flex-col @min-look-split:flex-row @min-look-split:items-start @min-look-split:gap-6',
    ],
    editPanel: [
      'flex min-w-0 flex-col gap-5 max-lg:gap-3.5',
      '@min-look-split:w-[460px] @min-look-split:shrink-0 @min-[1120px]:w-[500px]',
    ],
    previewPanel: [
      'min-w-0 @min-look-split:flex-1',
      '@min-look-split:sticky @min-look-split:top-admin-topbar @min-look-split:-m-1 @min-look-split:self-start @min-look-split:p-1',
    ],
  },
  variants: {
    isActive: {
      false: {
        editPanel: ['@max-look-split:hidden'],
        previewPanel: ['@max-look-split:hidden'],
      },
    },
  },
});
