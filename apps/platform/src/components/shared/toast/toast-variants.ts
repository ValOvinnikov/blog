import { TOAST_TYPE } from '@blog/config';
import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

export const toastVariants = tv({
  slots: {
    root: [
      'pointer-events-auto flex max-w-[400px] items-center gap-[9px]',
      'rounded-[10px] bg-admin-text px-[14px] py-[11px]',
      'text-[13px] text-white shadow-admin-lg',
      'transition-[opacity,transform] duration-[300ms] ease-out',
      'motion-reduce:transition-none',
    ],
    glyph: ['shrink-0 text-[13px] leading-none font-bold'],
    spinner: [
      'inline-block size-3.5 shrink-0 animate-spin rounded-full',
      'border-2 border-white/30 border-t-white',
      'motion-reduce:animate-none',
    ],
    message: ['min-w-0 flex-1'],
    time: ['shrink-0 text-white/60'],
    action: [
      'shrink-0 cursor-pointer font-semibold text-white underline-offset-2',
      'hover:underline',
    ],
    actionKey: ['ml-1 text-white/50'],
    dismiss: [
      'shrink-0 cursor-pointer text-white opacity-55',
      'hover:opacity-100',
      'focus-visible:opacity-100 focus-visible:outline-none',
      'focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-1 focus-visible:ring-offset-admin-text',
    ],
  },
  variants: {
    type: {
      [TOAST_TYPE.SUCCESS]: { glyph: ['text-white'] },
      [TOAST_TYPE.INFO]: { glyph: ['text-white'] },
      [TOAST_TYPE.WARNING]: { glyph: ['text-admin-warn-on-dark'] },
      [TOAST_TYPE.ERROR]: { glyph: ['text-white'] },
    },
    phase: {
      entering: { root: ['translate-x-2 opacity-0'] },
      visible: { root: ['translate-x-0 opacity-100'] },
      leaving: { root: ['translate-x-2 opacity-0'] },
    },
  },
  defaultVariants: {
    phase: 'visible',
  },
});

export type TToastVariants = VariantProps<typeof toastVariants>;
