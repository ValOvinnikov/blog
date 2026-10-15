import { tv } from '@platform/utils/tv/tv';

export const leadMessageVariants = tv({
  slots: {
    root: ['flex min-w-64 max-w-md flex-col items-start gap-1.5'],
    text: ['break-words whitespace-pre-line text-admin-text'],
  },
  variants: {
    isExpanded: {
      true: {},
      false: { text: ['line-clamp-2'] },
    },
  },
});
