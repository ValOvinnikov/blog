import { tv } from '@platform/utils/tv/tv';

export const emailPreviewVariants = tv({
  slots: {
    root: ['min-w-0'],
    body: ['flex', 'flex-col', 'gap-3'],
    note: ['text-[12.5px]', 'text-admin-muted'],
    footer: ['flex', 'flex-wrap', 'items-center', 'gap-3'],
  },
});
