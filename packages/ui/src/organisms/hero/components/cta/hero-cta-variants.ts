import { tv } from '@blog/ui/lib/styling';

/** In `Hero`'s copy column, `mt-auto` pins the CTA to the bottom when the column is stretched to the media's height, and `pt-` keeps a minimum gap above it when the column is only as tall as its own content. */
export const heroCtaVariants = tv({
  base: ['mt-auto pt-[18px]', 'flex flex-wrap items-center gap-3'],
});
