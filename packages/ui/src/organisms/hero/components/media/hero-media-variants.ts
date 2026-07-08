import { tv } from 'tailwind-variants';

export const heroMediaVariants = tv({
  base: [
    'relative isolate w-full overflow-hidden',
    'order-first aspect-video min-h-[170px] md:order-none md:aspect-[4/3]',
    'rounded-lg border border-border bg-surface-2',
  ],
});
