import { tv } from '@platform/utils/tv/tv';

export const emailSettingsVariants = tv({
  slots: {
    layout: [
      'grid grid-cols-1 items-start gap-6',
      'lg:grid-cols-[240px_minmax(0,1fr)]',
    ],
    main: [
      'grid grid-cols-1 items-start gap-6',
      'xl:grid-cols-[minmax(0,1fr)_minmax(420px,1fr)]',
    ],
    editPane: ['flex', 'min-w-0', 'flex-col', 'gap-4'],
    previewPane: ['flex', 'min-w-0', 'flex-col', 'gap-4'],
  },
  variants: {
    view: {
      edit: { previewPane: ['max-lg:hidden'] },
      preview: { editPane: ['max-lg:hidden'] },
    },
  },
});
