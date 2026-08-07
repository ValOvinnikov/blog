import { TOAST_TYPE } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const toastVariants = tv({
  slots: {
    root: [
      'relative w-full overflow-hidden',
      'rounded-md border border-border border-l-[3px] bg-surface shadow-sm',
      'pointer-events-auto',
      'transition-[transform_var(--duration-slow)_var(--ease-console),opacity_var(--duration-base)_var(--ease-console)]',
      'motion-reduce:transition-[opacity_var(--duration-base)_linear]',
    ],
    bar: [
      'flex items-center gap-1.5',
      'border-b border-border bg-surface-2',
      'px-3 py-1.5',
      'font-mono text-label text-text',
    ],
    glyph: ['shrink-0 text-[0.82rem] leading-none font-bold'],
    spinner: ['shrink-0'],
    cmdCommand: ['text-muted'],
    cmdState: ['font-semibold'],
    time: ['shrink-0 text-label text-subtle'],
    dismiss: [
      'shrink-0 border-0 bg-transparent p-0',
      'text-subtle',
      'transition-colors duration-fast ease-console',
      'cursor-pointer hover:text-error',
      'focus-visible:ring-accent focus-visible:ring-offset-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    ],
    body: ['flex flex-col gap-1.5 p-3'],
    message: [
      'flex items-baseline gap-1.5',
      'text-card-copy text-text',
      'leading-snug',
    ],
    prompt: ['shrink-0'],
    actions: ['flex items-center gap-1.5'],
    action: [
      'inline-flex items-center gap-1',
      'rounded-sm border border-border-strong px-2 py-1',
      'bg-surface text-subtle',
      'font-mono text-label',
      'transition-colors duration-base ease-console',
      'cursor-pointer',
      'focus-visible:ring-accent focus-visible:ring-offset-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    ],
    actionKey: [
      'rounded-[3px] border border-border px-[0.4ch] text-label text-subtle',
    ],
    timer: [
      'absolute inset-x-0 bottom-0 h-0.5 origin-left opacity-70',
      'motion-reduce:hidden',
    ],
  },
  variants: {
    type: {
      [TOAST_TYPE.SUCCESS]: {
        root: ['border-l-success'],
        glyph: ['text-success'],
        cmdState: ['text-success'],
        prompt: ['text-success'],
        action: ['hover:border-success hover:text-success'],
        timer: ['bg-success'],
      },
      [TOAST_TYPE.INFO]: {
        root: ['border-l-accent'],
        glyph: ['text-accent'],
        cmdState: ['text-accent'],
        prompt: ['text-accent'],
        action: ['hover:border-accent hover:text-accent'],
        timer: ['bg-accent'],
      },
      [TOAST_TYPE.WARNING]: {
        root: ['border-l-warn'],
        glyph: ['text-warn'],
        cmdState: ['text-warn'],
        prompt: ['text-warn'],
        action: ['hover:border-warn hover:text-warn'],
        timer: ['bg-warn'],
      },
      [TOAST_TYPE.ERROR]: {
        root: ['border-l-error'],
        glyph: ['text-error'],
        cmdState: ['text-error'],
        prompt: ['text-error'],
        action: ['hover:border-error hover:text-error'],
        timer: ['bg-error'],
      },
    },
    phase: {
      entering: {
        root: ['translate-x-[120%] opacity-0', 'motion-reduce:translate-x-0'],
      },
      visible: { root: ['translate-x-0 opacity-100'] },
      leaving: {
        root: ['translate-x-[120%] opacity-0', 'motion-reduce:translate-x-0'],
      },
    },
    hasTime: {
      true: { time: ['ml-auto'] },
      false: { dismiss: ['ml-auto'] },
    },
    paused: {
      true: { timer: ['[animation-play-state:paused]'] },
    },
  },
  defaultVariants: {
    phase: 'visible',
    hasTime: false,
    paused: false,
  },
});

export type TToastVariants = VariantProps<typeof toastVariants>;
