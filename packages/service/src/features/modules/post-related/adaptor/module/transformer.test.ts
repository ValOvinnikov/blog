import {
  BRAND_VARIANT,
  CARD_STYLE,
  DENSITY,
  DISPLAY_MODE,
  GRID_COLUMNS,
  RADIUS_SCALE,
} from '@blog/config/constants';
import { mockRawPostRelatedModule } from '@blog/service/testing/modules/post-related/fixtures';
import { faker } from '@faker-js/faker';

import { toPostRelatedModuleDocument } from './transformer';

faker.seed(23);

const MOCK_LIMIT = faker.number.int({ min: 1, max: 12 });

describe(toPostRelatedModuleDocument, () => {
  it('maps the module fields, keeping the authored limit', () => {
    const result = toPostRelatedModuleDocument(
      mockRawPostRelatedModule({ limit: MOCK_LIMIT }),
    );

    expect(result.brandVariant).toBe(BRAND_VARIANT.PRIMARY);
    expect(result.showImages).toBe(true);
    expect(result.limit).toBe(MOCK_LIMIT);
  });

  it.each([
    { displayMode: DISPLAY_MODE.CAROUSEL },
    {
      cardStyle: CARD_STYLE.FILLED,
      radiusScale: RADIUS_SCALE.LG,
      density: DENSITY.COMPACT,
      columns: GRID_COLUMNS.FOUR,
    },
  ])('maps an authored %o straight through', (authored) => {
    const module = toPostRelatedModuleDocument(
      mockRawPostRelatedModule(authored),
    );

    expect(module).toMatchObject(authored);
  });

  it('maps unset appearance overrides and display mode to undefined', () => {
    const module = toPostRelatedModuleDocument(mockRawPostRelatedModule());

    expect(module).toMatchObject({
      cardStyle: undefined,
      radiusScale: undefined,
      density: undefined,
      columns: undefined,
      displayMode: undefined,
    });
  });
});
