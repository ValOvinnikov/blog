import { tv } from '@platform/utils/tv/tv';

export const portableTextEditorLinkControlVariants = tv({
  slots: {
    root: ['flex', 'flex-wrap', 'items-center', 'gap-2'],
    input: [
      'min-h-11 w-full md:min-h-0 md:w-56 rounded-admin-control border px-2 py-1',
      'text-[16px] md:text-[13px] text-admin-text bg-admin-surface border-admin-control-line',
      'focus-visible:outline-2 focus-visible:outline-admin-brand-weak focus-visible:border-admin-brand',
    ],
    error: ['order-last basis-full text-[11.5px] text-admin-bad'],
  },
});
