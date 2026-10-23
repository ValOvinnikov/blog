import type { THeroModuleType } from '@blog/config';
import {
  MOCK_HERO_MODULE_ID,
  mockCtaSlotView,
  mockRawCtaRef,
} from '@blog/service/testing/pages/fixtures';

import { toHeroSlot, toModule, type TRawModule } from './to-module';

describe(toModule, () => {
  it('maps a raw module reference to its id/type', () => {
    expect(toModule(mockRawCtaRef())).toEqual(mockCtaSlotView());
  });
});

describe(toHeroSlot, () => {
  it('maps a module_hero* reference to a hero slot', () => {
    expect(
      toHeroSlot({ _id: MOCK_HERO_MODULE_ID, _type: 'module_hero' }),
    ).toEqual({
      id: MOCK_HERO_MODULE_ID,
      type: 'module_hero',
    });
  });

  it('throws when the reference is not a hero type', () => {
    const nonHeroModule =
      mockRawCtaRef() as unknown as TRawModule<THeroModuleType>;

    expect(() => toHeroSlot(nonHeroModule)).toThrow(
      'is not a module_hero* type',
    );
  });

  it('returns undefined when the reference is null', () => {
    expect(toHeroSlot(null)).toBeUndefined();
  });

  it('returns undefined when the reference is undefined', () => {
    expect(toHeroSlot(undefined)).toBeUndefined();
  });
});
