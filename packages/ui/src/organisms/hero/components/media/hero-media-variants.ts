import { tv } from '@blog/ui/lib/tv';

export const heroMediaVariants = tv({
  base: [
    'relative isolate w-full overflow-hidden',
    'order-first lg:order-none',
    'aspect-video lg:aspect-[4/3]',
    'min-h-[170px]',
    'rounded-lg border border-border bg-surface-2',
  ],
});
