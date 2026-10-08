import { tv } from '@platform/utils/tv/tv';

export const emailPreviewVariants = tv({
  slots: {
    root: ['flex', 'min-w-0', 'flex-col', 'gap-3'],
    toolbar: ['flex', 'flex-wrap', 'items-center', 'justify-between', 'gap-3'],
    heading: ['text-[13px]', 'font-semibold', 'text-admin-text'],
    note: ['text-[12.5px]', 'text-admin-muted'],
    footer: ['flex', 'flex-wrap', 'items-center', 'gap-3'],
  },
});
