import { tv } from '@platform/utils/tv/tv';

export const portableTextEditorToggleButtonVariants = tv({
  base: [
    'rounded-[7px] border border-transparent px-2 py-1',
    'text-[12.5px] text-admin-text',
    'hover:bg-admin-line-2',
    'focus-visible:outline-2 focus-visible:outline-admin-brand-weak',
    'cursor-pointer',
  ],
  variants: {
    isActive: {
      true: 'border-admin-brand bg-admin-brand-weak',
    },
    isBold: {
      true: 'font-bold',
    },
    isItalic: {
      true: 'italic',
    },
  },
});
