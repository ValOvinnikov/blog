/** A `module_hero`/`module_newsletter` document's legacy `appearance` shape. */
export type TLegacyAppearance = {
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
 * Pure transform: builds the new `layout`/`heroLayout` object value from a
 * doc's legacy `appearance`. `containerWidth` only carries over for
 * `module_newsletter` — `heroLayoutSchema` has no such field by design.
 * `appearance.align` is confirmed dead (no downstream reader, and its old
 * START/END vocabulary doesn't match the `HEADING_ALIGN` enum used
 * elsewhere) and is never copied. Exported so it's unit-testable without a
 * live dataset connection — see `./transform.test.ts`.
 */
export const appearanceToLayout = (
  doc: TLegacyAppearanceDoc,
  { includeContainerWidth }: { includeContainerWidth: boolean },
): TLayoutValue | undefined => {
  if (doc.layout !== undefined) return undefined;

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
