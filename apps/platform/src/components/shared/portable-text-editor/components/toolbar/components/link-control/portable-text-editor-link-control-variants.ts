import { tv } from '@platform/utils/tv/tv';

export const portableTextEditorLinkControlVariants = tv({
  slots: {
    root: ['flex', 'items-center', 'gap-2'],
    input: [
      'w-56 rounded-[7px] border px-2 py-1',
      'text-[13px] text-admin-text bg-admin-surface border-admin-line',
      'focus-visible:outline-2 focus-visible:outline-admin-brand-weak focus-visible:border-admin-brand',
    ],
  },
});
