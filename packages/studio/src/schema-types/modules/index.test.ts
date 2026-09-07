import { isHeroModuleType } from '@blog/config/constants';
import { HERO_SCHEMA_TYPES, modules } from '@blog/studio/schema-types/modules';

describe('HERO_SCHEMA_TYPES', () => {
  it('lists every registered module schema whose name is in the hero family', () => {
    const registeredHeroNames = modules
      .map((schema) => schema.name)
      .filter((name) => isHeroModuleType(name));

    const listedHeroNames = HERO_SCHEMA_TYPES.map((schema) => schema.name);

    expect(listedHeroNames.sort()).toEqual(registeredHeroNames.sort());
  });
});
