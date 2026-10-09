import { tv } from '@platform/utils/tv/tv';

export const portableTextEditorToggleButtonVariants = tv({
  slots: {
    button: [
      'inline-flex items-center justify-center',
      'rounded-[7px] border border-transparent px-2 py-1',
      'min-h-11 min-w-11 md:min-h-0 md:min-w-0',
      'text-[12.5px] text-admin-text',
      'hover:bg-admin-line-2',
      'outline-hidden focus-visible:ring-2 focus-visible:ring-admin-brand focus-visible:ring-offset-2',
      'cursor-pointer',
    ],
    tooltip: [
      'rounded-[6px] bg-admin-text px-2 py-1',
      'text-[11.5px] text-admin-surface shadow-admin-lg',
    ],
  },
  variants: {
    isActive: {
      true: { button: 'border-admin-brand bg-admin-brand-weak' },
    },
    isIconOnly: {
      true: { button: 'md:size-7 md:p-0' },
    },
  },
});
