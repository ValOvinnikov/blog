import { tv } from '@blog/ui/lib/styling';

/**
 * Renders inside `Hero`'s copy column, which is a full-height flex column
 * (`hero-variants.ts` `copy` slot). `mt-auto` pins the CTA to the bottom of
 * that column when the column is stretched to the media's height; `pt-`
 * keeps a minimum gap above it when the column is only as tall as its own
 * content (e.g. no `Hero.Media`).
 */
export const heroCtaVariants = tv({
  base: ['mt-auto pt-[18px]', 'flex flex-wrap items-center gap-3'],
});
