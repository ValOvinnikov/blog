import type { THeroVariant } from '@blog/config/constants';

type THeroVariantParent = { variant?: string };

export const isNotHeroVariant =
  (variant: THeroVariant) =>
  ({ parent }: { parent?: unknown }): boolean =>
    (parent as THeroVariantParent | undefined)?.variant !== variant;
