import { tv } from '@blog/ui/lib/styling';

export const footerVariants = tv({
  base: [
    'flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between',
    'px-gutter [padding-block:0.875rem]',
    'bg-brand-primary-muted border-t border-border-strong',
    'font-mono text-label text-muted',
  ],
});
