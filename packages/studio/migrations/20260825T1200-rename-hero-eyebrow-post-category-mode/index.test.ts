import { HERO_FIELD_MODE } from '@blog/config/constants';
import { at, set } from 'sanity/migrate';

import { renameHeroEyebrowPostCategoryMode } from './index';

const LEGACY_POST_CATEGORY_MODE = 'POST_CATEGORY';

describe(renameHeroEyebrowPostCategoryMode, () => {
  it('renames the legacy post category mode to the post topic mode', () => {
    const result = renameHeroEyebrowPostCategoryMode({
      heroEyebrowMode: LEGACY_POST_CATEGORY_MODE,
    });

    expect(result).toEqual([
      at('heroEyebrowMode', set(HERO_FIELD_MODE.POST_TOPIC)),
    ]);
  });

  it.each([HERO_FIELD_MODE.CUSTOM, HERO_FIELD_MODE.POST_TOPIC, undefined])(
    'leaves a %s eyebrow mode alone',
    (heroEyebrowMode) => {
      const result = renameHeroEyebrowPostCategoryMode({ heroEyebrowMode });

      expect(result).toBeUndefined();
    },
  );
});
