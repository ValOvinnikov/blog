type TVariantCarrier = { variant?: string } | undefined;

export const isNotVariant =
  (variant: string) =>
  ({ parent }: { parent?: unknown }): boolean =>
    (parent as TVariantCarrier)?.variant !== variant;

export const isVariantDocument =
  (variant: string) =>
  ({ document }: { document?: unknown }): boolean =>
    (document as TVariantCarrier)?.variant === variant;
