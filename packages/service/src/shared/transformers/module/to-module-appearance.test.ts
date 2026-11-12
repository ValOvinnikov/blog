import {
  CARD_STYLE,
  DENSITY,
  GRID_COLUMNS,
  RADIUS_SCALE,
} from '@blog/config/constants';
import { mockRawModuleAppearance } from '@blog/service/testing/shared/module-appearance';

import { toModuleAppearance } from './to-module-appearance';

describe(toModuleAppearance, () => {
  it('keeps every authored override', () => {
    const authored = {
      cardStyle: CARD_STYLE.RAISED,
      radiusScale: RADIUS_SCALE.LG,
      density: DENSITY.COMPACT,
      columns: GRID_COLUMNS.FOUR,
    };

    expect(toModuleAppearance(mockRawModuleAppearance(authored))).toEqual(
      authored,
    );
  });

  it('leaves every unset override empty', () => {
    expect(toModuleAppearance(mockRawModuleAppearance())).toEqual({
      cardStyle: undefined,
      radiusScale: undefined,
      density: undefined,
      columns: undefined,
    });
  });
});
