import { HERO_FIELD_MODE } from '@blog/config/constants';
import { at, set } from 'sanity/migrate';

import { renameHeroEyebrowPostCategoryMode } from './index';

describe(renameHeroEyebrowPostCategoryMode, () => {
  it('renames a legacy POST_CATEGORY value to POST_TOPIC', () => {
    const result = renameHeroEyebrowPostCategoryMode({
      heroEyebrowMode: 'POST_CATEGORY',
    });

    expect(result).toEqual([
      at('heroEyebrowMode', set(HERO_FIELD_MODE.POST_TOPIC)),
    ]);
  });

  it('leaves a CUSTOM mode untouched', () => {
    const result = renameHeroEyebrowPostCategoryMode({
      heroEyebrowMode: HERO_FIELD_MODE.CUSTOM,
    });

    expect(result).toBeUndefined();
  });

  it('leaves an unset heroEyebrowMode untouched', () => {
    const result = renameHeroEyebrowPostCategoryMode({});

    expect(result).toBeUndefined();
  });

  it('is idempotent for an already-migrated POST_TOPIC value', () => {
    const result = renameHeroEyebrowPostCategoryMode({
      heroEyebrowMode: HERO_FIELD_MODE.POST_TOPIC,
    });

    expect(result).toBeUndefined();
  });
});
