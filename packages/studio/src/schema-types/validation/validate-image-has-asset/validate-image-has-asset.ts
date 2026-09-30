type TImageValue = { asset?: unknown };

/**
 * `rule.required()` on an image object is satisfied by alt text or crop data
 * alone, so a picture removed after upload still passes. This checks for the
 * asset reference itself, which is what actually renders.
 */
export const validateImageHasAsset =
  (message: string) =>
  (value: TImageValue | undefined): string | true =>
    value?.asset ? true : message;
