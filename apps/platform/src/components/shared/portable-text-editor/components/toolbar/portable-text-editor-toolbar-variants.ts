import { tv } from '@platform/utils/tv/tv';

export const portableTextEditorToolbarVariants = tv({
  slots: {
    root: [
      'flex flex-col gap-2 rounded-t-admin-control border px-1.5 py-1',
      'border-admin-control-line bg-admin-surface-2',
    ],
    bar: ['flex', 'flex-wrap', 'items-center', 'gap-1'],
    divider: ['mx-1', 'h-4', 'w-px', 'bg-admin-line'],
  },
});
