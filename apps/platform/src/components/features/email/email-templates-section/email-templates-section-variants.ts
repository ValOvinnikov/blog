import { tv } from '@platform/utils/tv/tv';

export const emailTemplatesSectionVariants = tv({
  slots: {
    root: ['flex', 'flex-col', 'gap-4'],
    heading: ['flex', 'flex-col', 'gap-1'],
    title: ['text-[15px]', '[font-weight:650]', 'text-admin-text'],
    description: ['text-[12.5px]', 'text-admin-muted'],
  },
});
