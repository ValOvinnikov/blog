import { tv } from '@platform/utils/tv/tv';

export const lookFormVariants = tv({
  slots: {
    layout: ['@container flex flex-col gap-[18px] max-lg:gap-3.5'],
    columns: [
      'flex flex-col @min-[900px]:flex-row @min-[900px]:items-start @min-[900px]:gap-6',
    ],
    editPanel: [
      'flex min-w-0 flex-col gap-5 max-lg:gap-3.5',
      '@min-[900px]:w-[460px] @min-[900px]:shrink-0 @min-[1120px]:w-[500px]',
    ],
    previewPanel: [
      'min-w-0 @min-[900px]:flex-1',
      '@min-[900px]:sticky @min-[900px]:top-admin-topbar @min-[900px]:-m-1 @min-[900px]:self-start @min-[900px]:p-1',
    ],
  },
  variants: {
    isActive: {
      false: {
        editPanel: ['@max-[900px]:hidden'],
        previewPanel: ['@max-[900px]:hidden'],
      },
    },
  },
});
