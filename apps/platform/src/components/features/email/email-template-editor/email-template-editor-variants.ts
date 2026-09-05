import { tv } from '@platform/utils/tv/tv';

export const emailTemplateEditorVariants = tv({
  slots: {
    grid: ['grid', 'grid-cols-1', 'gap-6', 'lg:grid-cols-2'],
    stack: ['flex', 'flex-col', 'gap-4'],
    footer: ['flex', 'items-center', 'justify-between'],
    previewHeading: ['text-[13px]', 'font-semibold', 'text-admin-text'],
  },
});
