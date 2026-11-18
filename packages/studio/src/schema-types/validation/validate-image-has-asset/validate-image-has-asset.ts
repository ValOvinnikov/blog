type TImageValue = { asset?: unknown };

// `rule.required()` on an image passes on alt text or crop data alone, with no asset.
export const validateImageHasAsset =
  (message: string) =>
  (value: TImageValue | undefined): string | true =>
    value?.asset ? true : message;
