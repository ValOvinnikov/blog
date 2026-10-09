import { tv } from '@platform/utils/tv/tv';

export const voiceListRowVariants = tv({
  slots: {
    root: [
      'flex min-h-11 w-full items-center gap-3',
      'bg-admin-surface px-3 py-2 text-left',
      'cursor-pointer hover:bg-admin-surface-2',
      'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-admin-brand-weak',
    ],
    label: ['shrink-0 text-[13px] font-semibold text-admin-text'],
    text: ['min-w-0 flex-1 truncate text-[12.5px] text-admin-muted'],
    chevron: ['shrink-0 text-admin-faint'],
  },
  variants: {
    hasError: {
      true: { root: ['ring-1 ring-admin-bad ring-inset'] },
    },
  },
});
