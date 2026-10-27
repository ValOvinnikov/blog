import {
  CONTAINER_WIDTH,
  CONTENT_ALIGNMENT,
  SPACING_SCALE,
} from '@blog/config/constants';
import { at, setIfMissing, unset } from 'sanity/migrate';

import { migrateModuleAppearanceToLayout } from './index';

const MOCK_APPEARANCE = {
  spacingTop: SPACING_SCALE.LG,
  spacingBottom: SPACING_SCALE.SM,
  containerWidth: CONTAINER_WIDTH.WIDE,
  divider: true,
  align: CONTENT_ALIGNMENT.LEFT,
};

const MOCK_LAYOUT = {
  spacingTop: SPACING_SCALE.LG,
  spacingBottom: SPACING_SCALE.SM,
  dividerTop: true,
  dividerBottom: true,
};

describe(migrateModuleAppearanceToLayout, () => {
  it('moves hero appearance onto layout without the container width', () => {
    const result = migrateModuleAppearanceToLayout('module_hero', {
      appearance: MOCK_APPEARANCE,
    });

    expect(result).toEqual([
      at('layout', setIfMissing(MOCK_LAYOUT)),
      at('appearance', unset()),
    ]);
  });

  it('moves newsletter appearance onto layout with the container width', () => {
    const result = migrateModuleAppearanceToLayout('module_newsletter', {
      appearance: MOCK_APPEARANCE,
    });

    expect(result).toEqual([
      at(
        'layout',
        setIfMissing({ ...MOCK_LAYOUT, containerWidth: CONTAINER_WIDTH.WIDE }),
      ),
      at('appearance', unset()),
    ]);
  });

  it('only unsets appearance when nothing worth copying remains', () => {
    const result = migrateModuleAppearanceToLayout('module_hero', {
      appearance: { align: CONTENT_ALIGNMENT.LEFT },
    });

    expect(result).toEqual([at('appearance', unset())]);
  });

  it('leaves a doc that already has a layout alone', () => {
    const result = migrateModuleAppearanceToLayout('module_hero', {
      appearance: MOCK_APPEARANCE,
      layout: MOCK_LAYOUT,
    });

    expect(result).toBeUndefined();
  });
});
