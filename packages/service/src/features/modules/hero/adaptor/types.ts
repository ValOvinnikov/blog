import type {
  ILink,
  ISanityImage,
  TBrandVariantOf,
  TLayout,
  TMaybeUndefined,
} from '@blog/config';

/**
 * The hero's primary CTA has no `ariaLabel` — unlike `ILink`, whose
 * `ariaLabel` targets assistive tech only. Lighthouse's SEO `link-text`
 * audit reads the link's visible text content, not `aria-label`, so a
 * descriptive suffix for the generic fallback label must be rendered as
 * real (if visually hidden) text. `hiddenLabelSuffix` carries that text;
 * the web layer renders it as an `sr-only` span appended to `label`.
 */
type THeroPrimaryAction = Omit<ILink, 'ariaLabel'> & {
  hiddenLabelSuffix: TMaybeUndefined<string>;
};

export type THeroModule = {
  brandVariant: TBrandVariantOf<'BRAND_PRIMARY' | 'PRIMARY' | 'SECONDARY'>;
  eyebrow: TMaybeUndefined<string>;
  title: TMaybeUndefined<string>;
  subtitle: TMaybeUndefined<string>;
  sanityImage: TMaybeUndefined<ISanityImage>;
  primaryAction: TMaybeUndefined<THeroPrimaryAction>;
  secondaryAction: TMaybeUndefined<ILink>;
  layout: TMaybeUndefined<TLayout>;
};
