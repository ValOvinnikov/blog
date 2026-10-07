import { brandVariantTitle } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';

export const moduleSubtitle = (
  brandVariant: unknown,
  ...details: (string | undefined)[]
): string | undefined => {
  const parts = [brandVariantTitle(brandVariant), ...details].filter(
    (part): part is string => Boolean(part),
  );

  return parts.length > 0 ? parts.join(' · ') : undefined;
};
