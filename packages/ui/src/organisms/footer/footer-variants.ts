import { tv } from '@blog/ui/lib/styling';

export const footerVariants = tv({
  base: [
    'mt-[22px] flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between',
    'px-gutter [padding-block:0.875rem]',
    'border-t border-border',
    'font-mono text-label text-text-subtle',
  ],
});
