import { tv } from '@platform/utils/tv/tv';

export const emailTemplateEditorVariants = tv({
  slots: {
    grid: ['grid', 'grid-cols-1', 'gap-6', 'xl:grid-cols-2'],
    stack: ['flex', 'flex-col', 'gap-4'],
    fieldStatus: ['flex', 'items-center', 'gap-2'],
    note: ['text-[12.5px]', 'text-admin-muted'],
    previewHeading: ['text-[13px]', 'font-semibold', 'text-admin-text'],
  },
});
