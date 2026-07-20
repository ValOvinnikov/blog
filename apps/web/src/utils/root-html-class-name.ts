import { BRAND_VARIANTS, type TBrandVariants } from '@blog/config';

const BRAND_VARIANT_CLASS_NAMES: Record<TBrandVariants, string | undefined> = {
  [BRAND_VARIANTS.CONSOLE]: undefined,
  [BRAND_VARIANTS.INDIGO]: 'brand-indigo',
};

/**
 * Builds the root `<html>` `className`: the given base classes (the font
 * variables in `RootLayout`) plus, looked up from `BRAND_VARIANT_CLASS_NAMES`,
 * the class that switches the token overrides in the global stylesheet for
 * the CMS-configured brand variant. Console (the default) maps to
 * `undefined`, so it and an unresolved variant (fetch failure) both render
 * the same base className as before this switch existed. Adding a future
 * brand variant means adding one entry to the map, not a new branch.
 *
 * @example
 * buildRootHtmlClassName('font-a font-b', BRAND_VARIANTS.INDIGO) // 'font-a font-b brand-indigo'
 * buildRootHtmlClassName('font-a font-b', undefined) // 'font-a font-b'
 */
export function buildRootHtmlClassName(
  baseClassName: string,
  variant?: TBrandVariants,
): string {
  const variantClassName = variant && BRAND_VARIANT_CLASS_NAMES[variant];

  return variantClassName
    ? `${baseClassName} ${variantClassName}`
    : baseClassName;
}
