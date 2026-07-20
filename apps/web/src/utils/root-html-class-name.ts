import { BRAND_VARIANTS, type TBrandVariants } from '@blog/config';

/**
 * Builds the root `<html>` `className`: the given base classes (the font
 * variables in `RootLayout`) plus, when the CMS-configured brand variant is
 * Indigo, a `brand-indigo` class that switches the token overrides in the
 * global stylesheet. Console (the default) and an unresolved variant (fetch
 * failure) render the same base className as before this switch existed.
 *
 * @example
 * buildRootHtmlClassName('font-a font-b', BRAND_VARIANTS.INDIGO) // 'font-a font-b brand-indigo'
 * buildRootHtmlClassName('font-a font-b', undefined) // 'font-a font-b'
 */
export function buildRootHtmlClassName(
  baseClassName: string,
  variant?: TBrandVariants,
): string {
  if (variant === BRAND_VARIANTS.INDIGO) {
    return `${baseClassName} brand-indigo`;
  }

  return baseClassName;
}
