import {
  LOOK_FIELD,
  type TLookField,
  type TTenantPlan,
} from '@blog/db/constants';
import { isLookFieldEntitled } from '@blog/db/utils/effective-look/effective-look';
import type { TModuleAppearance } from '@blog/service';

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
  plan: TTenantPlan,
): TSectionStyleOverrides => {
  const isEntitled = (field: keyof TSectionStyleOverrides) =>
    isLookFieldEntitled(OVERRIDE_LOOK_FIELD[field], plan);

  return {
    cardStyle: isEntitled('cardStyle') ? overrides.cardStyle : undefined,
    radiusScale: isEntitled('radiusScale') ? overrides.radiusScale : undefined,
    density: isEntitled('density') ? overrides.density : undefined,
  };
};
