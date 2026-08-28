import { tv } from '@platform/utils/tv/tv';

export const confirmDialogVariants = tv({
  slots: {
    backdrop: [
      'fixed inset-0 bg-admin-text/50',
      'data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
      'transition-opacity duration-base ease-console',
    ],
    popup: [
      'fixed top-1/2 left-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2',
      'flex flex-col gap-4 rounded-admin border border-admin-line bg-admin-surface p-6 shadow-admin-lg',
      'data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
      'transition-opacity duration-base ease-console',
    ],
    title: ['text-[15px] font-semibold text-admin-text'],
    description: ['text-[13px] text-admin-muted'],
    hint: ['text-[11.5px] text-admin-muted'],
    actions: ['flex justify-end gap-2'],
  },
});
