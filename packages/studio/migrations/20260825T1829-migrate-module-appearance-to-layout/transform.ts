/** A `module_hero`/`module_newsletter` document's legacy `appearance` shape. */
type TLegacyAppearance = {
  spacingTop?: string;
  spacingBottom?: string;
  containerWidth?: string;
  divider?: boolean;
  align?: string;
};

export type TLegacyAppearanceDoc = {
  appearance?: TLegacyAppearance;
  layout?: unknown;
};

export type TLayoutValue = {
  spacingTop?: string;
  spacingBottom?: string;
  containerWidth?: string;
  dividerTop?: boolean;
  dividerBottom?: boolean;
};

/**
 * Pure transform: builds the new `layout` field's object value (registered
 * as `heroLayout` on `module_hero`, `layout` on `module_newsletter`) from a
 * doc's legacy `appearance`. `appearance.align` is confirmed dead and is
 * never copied — no downstream reader, and its START/END vocabulary doesn't
 * match the `CONTENT_ALIGNMENT` enum used elsewhere.
 */
export const appearanceToLayout = (
  doc: TLegacyAppearanceDoc,
  { includeContainerWidth }: { includeContainerWidth: boolean },
): TLayoutValue | undefined => {
  if (doc.layout != null) return undefined;

  const { appearance } = doc;
  if (!appearance) return undefined;

  const { spacingTop, spacingBottom, containerWidth, divider } = appearance;

  return {
    ...(spacingTop ? { spacingTop } : {}),
    ...(spacingBottom ? { spacingBottom } : {}),
    ...(includeContainerWidth && containerWidth ? { containerWidth } : {}),
    ...(divider !== undefined
      ? { dividerTop: divider, dividerBottom: divider }
      : {}),
  };
};
