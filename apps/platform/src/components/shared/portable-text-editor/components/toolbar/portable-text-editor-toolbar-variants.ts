import { SIZE } from '@blog/config';
import { tv } from '@platform/utils/tv/tv';

export const portableTextEditorToolbarVariants = tv({
  slots: {
    root: ['flex flex-col gap-2'],
    bar: ['flex', 'flex-wrap', 'items-center'],
    divider: ['mx-1', 'h-4', 'w-px', 'bg-platform-line'],
  },
  variants: {
    size: {
      [SIZE.SM]: {
        root: ['p-1 border-b border-platform-line-2 bg-platform-surface'],
        bar: ['gap-0.5'],
      },
      [SIZE.MD]: {
        root: [
          'rounded-t-platform-control border px-1.5 py-1',
          'border-platform-control-line bg-platform-surface-2',
        ],
        bar: ['gap-1'],
      },
    },
  },
  defaultVariants: {
    size: SIZE.MD,
  },
});
