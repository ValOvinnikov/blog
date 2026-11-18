import { LOOK_FIELD, type TLookField } from '@shinefold/db/constants';
import { isLookFieldWithin } from '@shinefold/db/utils/effective-look/effective-look';
import type { TTenantEntitlements } from '@shinefold/db/utils/resolve-tenant-entitlements/resolve-tenant-entitlements';
import type { TModuleAppearance } from '@shinefold/service';

export type TSectionStyleOverrides = Pick<
  TModuleAppearance,
  'cardStyle' | 'radiusScale' | 'density'
>;

const OVERRIDE_LOOK_FIELD = {
  cardStyle: LOOK_FIELD.CARD_STYLE,
  radiusScale: LOOK_FIELD.RADIUS_SCALE,
  density: LOOK_FIELD.DENSITY,
} as const satisfies Record<keyof TSectionStyleOverrides, TLookField>;

export const gateSectionStyleOverrides = (
  overrides: TSectionStyleOverrides,
  entitlements: Pick<TTenantEntitlements, 'lookFields'>,
): TSectionStyleOverrides => {
  const isEntitled = (field: keyof TSectionStyleOverrides) =>
    isLookFieldWithin(OVERRIDE_LOOK_FIELD[field], entitlements);

  return {
    cardStyle: isEntitled('cardStyle') ? overrides.cardStyle : undefined,
    radiusScale: isEntitled('radiusScale') ? overrides.radiusScale : undefined,
    density: isEntitled('density') ? overrides.density : undefined,
  };
};
