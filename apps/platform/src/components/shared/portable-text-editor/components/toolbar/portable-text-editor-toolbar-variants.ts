import { tv } from '@platform/utils/tv/tv';

export const portableTextEditorToolbarVariants = tv({
  slots: {
    root: ['flex', 'flex-wrap', 'items-center', 'gap-1'],
    divider: ['mx-1', 'h-4', 'w-px', 'bg-admin-line'],
  },
});
