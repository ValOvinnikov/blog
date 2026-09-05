import { tv } from '@platform/utils/tv/tv';

export const portableTextEditorVariants = tv({
  slots: {
    root: ['flex', 'flex-col', 'gap-2'],
    editable: [
      'min-h-[140px] w-full rounded-[9px] border px-[11px] py-[9px]',
      'text-[13.5px] text-admin-text bg-admin-surface border-admin-line',
      'focus-visible:outline-2 focus-visible:outline-admin-brand-weak focus-visible:border-admin-brand',
      '[&_p]:m-0 [&_h2]:m-0 [&_h2]:text-[16px] [&_h2]:font-semibold',
      '[&_ul]:m-0 [&_ul]:pl-5 [&_ol]:m-0 [&_ol]:pl-5',
    ],
    link: ['text-admin-brand underline'],
  },
  variants: {
    isDisabled: {
      true: {
        editable: ['cursor-not-allowed text-admin-faint bg-admin-surface-2'],
      },
    },
  },
});
